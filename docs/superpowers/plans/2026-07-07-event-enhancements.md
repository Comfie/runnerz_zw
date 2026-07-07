# Event Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add event type, race logistics, registration deadline (with auto-close), expected runner count, and finisher medal flag to the RunZW platform.

**Architecture:** Single Prisma migration adds all new fields to the `Event` model. The data layer (`events.ts`, `organisers.ts`) is updated first so TypeScript compiles cleanly before touching UI. UI changes flow outward: filters → cards → detail page → registration page. No new utility files needed — `getCountdownLabel` is reused for deadline countdown.

**Tech Stack:** Next.js 16 App Router (TypeScript) · Prisma (PostgreSQL) · Tailwind CSS · `@/lib/countdown` (existing)

**Commit policy:** Confirm with user before every `git commit`. No `Co-authored-by` lines.

---

## File Structure

```
prisma/
  schema.prisma                                    ← add EventType enum + 5 fields

src/
  lib/
    events.ts                                      ← add eventType to EventFilter + buildWhere
    organisers.ts                                  ← add new fields to EventInput
  app/
    page.tsx                                       ← pass eventType from search params
    organiser/events/
      new/page.tsx                                 ← 5 new form fields
      new/actions.ts                               ← parse + pass new fields
      [id]/edit/page.tsx                           ← same 5 new fields with defaultValues
      [id]/edit/actions.ts                         ← parse + pass new fields
    events/[id]/page.tsx                           ← type badge, race day info, deadline, isRegistrationClosed
    register/[eventId]/page.tsx                    ← auto-close guard
  components/
    EventFilters.tsx                               ← event type dropdown, 5-column grid
    EventCard.tsx                                  ← type badge, urgency badge, runners, medal
```

---

### Task 1: Schema migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `EventType` enum and new fields to `schema.prisma`**

Add the enum directly before the `Event` model, and the five new fields inside the `Event` model after `coverImageUrl`:

```prisma
enum EventType {
  ROAD
  TRAIL
  ULTRA
  RELAY
  CHARITY
  KIDS
}

model Event {
  id              String         @id @default(cuid())
  title           String
  description     String
  startsAt        DateTime
  locationText    String
  lat             Float?
  lng             Float?
  distanceOptions String[]
  coverImageUrl   String?
  eventType            EventType?
  logistics            String?
  registrationDeadline DateTime?
  expectedRunners      Int?
  hasFinisherMedal     Boolean    @default(false)
  paymentInfo     String
  status          EventStatus    @default(DRAFT)
  clubId          String
  club            Club           @relation(fields: [clubId], references: [id])
  registrations   Registration[]
  createdAt       DateTime       @default(now())
}
```

- [ ] **Step 2: Run migration**

```bash
cd /Users/comfort/Projects/personal/parkrun-zw && npx prisma migrate dev --name add_event_enhancements
```

Expected output: migration created and applied, Prisma Client regenerated. No errors.

- [ ] **Step 3: Verify build still passes**

```bash
npm run build 2>&1 | tail -10
```

Expected: build passes with zero errors. All new columns are optional or defaulted, and the data-layer types (`EventFilter`, `EventInput`) are defined locally, so nothing references the new fields yet. If the build fails, investigate before continuing.

- [ ] **Step 4: Commit** (confirm with user first)

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add event type, logistics, registration deadline, runners, and medal fields"
```

---

### Task 2: Data layer — `events.ts` and `organisers.ts`

**Files:**
- Modify: `src/lib/events.ts`
- Modify: `src/lib/organisers.ts`

- [ ] **Step 1: Update `src/lib/events.ts`**

Add `eventType` to `EventFilter` and `buildWhere`. Import `EventType` as a value (Prisma generates a runtime enum object) and validate the raw search-param string against it — otherwise `/?eventType=BANANA` throws a Prisma invalid-enum error and crashes the landing page:

```ts
import { db } from "@/lib/db"
import { EventType } from "@prisma/client"
import type { Prisma } from "@prisma/client"

export type EventFilter = {
  from?: Date
  to?: Date
  location?: string
  distance?: string
  eventType?: string
}

export function buildWhere(f: EventFilter): Prisma.EventWhereInput {
  const where: Prisma.EventWhereInput = { status: "PUBLISHED" }

  if (f.distance) where.distanceOptions = { has: f.distance }
  if (f.location) {
    where.locationText = { contains: f.location, mode: "insensitive" }
  }
  if (f.from || f.to) {
    where.startsAt = {
      ...(f.from && { gte: f.from }),
      ...(f.to && { lte: f.to }),
    }
  }
  if (f.eventType && f.eventType in EventType) {
    where.eventType = f.eventType as EventType
  }

  return where
}

export function listPublishedEvents(f: EventFilter) {
  return db.event.findMany({
    where: buildWhere(f),
    orderBy: { startsAt: "asc" },
    include: { club: true },
  })
}

export function buildDistanceOptions(
  events: { distanceOptions: string[] }[],
): string[] {
  return Array.from(
    new Set(events.flatMap((event) => event.distanceOptions)),
  ).sort((a, b) => {
    const aNumber = Number.parseFloat(a)
    const bNumber = Number.parseFloat(b)
    if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) {
      return aNumber - bNumber
    }
    return a.localeCompare(b)
  })
}

export async function listPublishedDistanceOptions() {
  const events = await db.event.findMany({
    where: { status: "PUBLISHED" },
    select: { distanceOptions: true },
  })
  return buildDistanceOptions(events)
}

export function getEvent(id: string) {
  return db.event.findUnique({ where: { id }, include: { club: true } })
}
```

- [ ] **Step 2: Update `src/lib/organisers.ts`**

Import `EventType` and add new fields to `EventInput`:

```ts
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import type { EventType } from "@prisma/client"

export async function applyAsOrganiser(
  userId: string,
  clubName: string,
  contact: string,
) {
  const club = await db.club.create({
    data: { name: clubName, contact, ownerId: userId, verified: false },
  })
  await db.user.update({
    where: { id: userId },
    data: { role: "ORGANISER", clubId: club.id },
  })
  return club
}

export async function requireOrganiser(): Promise<{
  userId: string
  clubId: string
}> {
  const { auth } = await import("@/lib/auth")
  const session = await auth()
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) redirect("/signin")

  const club = await db.club.findUnique({ where: { ownerId: userId } })
  if (!club || !club.verified) redirect("/organiser/pending")
  return { userId, clubId: club.id }
}

type EventInput = {
  title: string
  description: string
  startsAt: Date
  locationText: string
  distanceOptions: string[]
  paymentInfo: string
  coverImageUrl?: string | null
  eventType?: EventType | null
  logistics?: string | null
  registrationDeadline?: Date | null
  expectedRunners?: number | null
  hasFinisherMedal?: boolean
}

export async function saveEvent(
  clubId: string,
  data: EventInput,
  id?: string,
) {
  if (id) {
    const existing = await db.event.findUnique({ where: { id } })
    if (!existing || existing.clubId !== clubId) throw new Error("not your event")
    return db.event.update({ where: { id }, data })
  }

  return db.event.create({ data: { ...data, clubId } })
}

export async function setEventStatus(
  eventId: string,
  clubId: string,
  status: "DRAFT" | "PUBLISHED",
) {
  const event = await db.event.findUnique({ where: { id: eventId } })
  if (!event || event.clubId !== clubId) throw new Error("not your event")
  return db.event.update({ where: { id: eventId }, data: { status } })
}
```

- [ ] **Step 3: Verify build passes**

```bash
cd /Users/comfort/Projects/personal/parkrun-zw && npm run build 2>&1 | tail -10
```

Expected: zero TypeScript errors. (UI files are unaffected — their prop types only widen in later tasks.)

- [ ] **Step 4: Commit** (confirm with user first)

```bash
git add src/lib/events.ts src/lib/organisers.ts
git commit -m "feat: add event enhancements to data layer (EventFilter, EventInput)"
```

---

### Task 3: Organiser forms — new event and edit event

**Files:**
- Modify: `src/app/organiser/events/new/page.tsx`
- Modify: `src/app/organiser/events/new/actions.ts`
- Modify: `src/app/organiser/events/[id]/edit/page.tsx`
- Modify: `src/app/organiser/events/[id]/edit/actions.ts`

Both the new-event and edit-event forms need identical new fields. The edit form pre-populates them from the existing event record.

- [ ] **Step 1: Rewrite `src/app/organiser/events/new/page.tsx`**

```tsx
import { createEvent } from "./actions"

export default function NewEvent() {
  return (
    <main className="app-container py-5 sm:py-8">
      <section className="surface mx-auto max-w-2xl rounded-[1.5rem] p-5 sm:p-7">
        <h1 className="text-2xl font-black">New event</h1>
        <EventForm action={createEvent} />
      </section>
    </main>
  )
}

function EventForm({ action }: { action: (formData: FormData) => void }) {
  return (
    <form action={action} className="mt-4 space-y-3">
      <input name="title" placeholder="Title" required className="field" />
      <select name="eventType" required className="field">
        <option value="">Select type</option>
        <option value="ROAD">Road</option>
        <option value="TRAIL">Trail</option>
        <option value="ULTRA">Ultra</option>
        <option value="RELAY">Relay</option>
        <option value="CHARITY">Charity</option>
        <option value="KIDS">Kids</option>
      </select>
      <textarea
        name="description"
        placeholder="Description"
        required
        className="field min-h-28"
      />
      <input
        name="startsAt"
        type="datetime-local"
        required
        className="field"
      />
      <input
        name="registrationDeadline"
        type="datetime-local"
        className="field"
      />
      <input
        name="locationText"
        placeholder="Location"
        required
        className="field"
      />
      <input
        name="distanceOptions"
        placeholder="Distances, e.g. 5k, 10k"
        required
        className="field"
      />
      <input
        name="expectedRunners"
        type="number"
        min="1"
        placeholder="Expected runners (optional)"
        className="field"
      />
      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" name="hasFinisherMedal" />
        Finisher medal awarded
      </label>
      <input
        name="coverImageUrl"
        placeholder="Cover image URL"
        className="field"
      />
      <textarea
        name="paymentInfo"
        placeholder="How runners should pay or complete registration"
        required
        className="field min-h-24"
      />
      <textarea
        name="logistics"
        placeholder="Parking, bag storage, water points, cut-off times, medical support... (optional)"
        className="field min-h-24"
      />
      <button className="button-primary">Save</button>
    </form>
  )
}
```

- [ ] **Step 2: Rewrite `src/app/organiser/events/new/actions.ts`**

```ts
"use server"

import { requireOrganiser, saveEvent } from "@/lib/organisers"
import { redirect } from "next/navigation"
import { EventType } from "@prisma/client"

export async function createEvent(formData: FormData) {
  const { clubId } = await requireOrganiser()
  const eventType = String(formData.get("eventType") ?? "")
  await saveEvent(clubId, {
    title: String(formData.get("title")),
    description: String(formData.get("description")),
    startsAt: new Date(String(formData.get("startsAt"))),
    locationText: String(formData.get("locationText")),
    distanceOptions: String(formData.get("distanceOptions"))
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    paymentInfo: String(formData.get("paymentInfo")),
    coverImageUrl: String(formData.get("coverImageUrl") ?? "") || null,
    eventType: eventType in EventType ? (eventType as EventType) : null,
    registrationDeadline: formData.get("registrationDeadline")
      ? new Date(String(formData.get("registrationDeadline")))
      : null,
    expectedRunners: formData.get("expectedRunners")
      ? parseInt(String(formData.get("expectedRunners")), 10)
      : null,
    hasFinisherMedal: formData.get("hasFinisherMedal") === "on",
    logistics: String(formData.get("logistics") ?? "") || null,
  })
  redirect("/organiser/dashboard")
}
```

- [ ] **Step 3: Rewrite `src/app/organiser/events/[id]/edit/page.tsx`**

Pre-populate new fields from the existing event record:

```tsx
import { db } from "@/lib/db"
import { requireOrganiser } from "@/lib/organisers"
import { notFound } from "next/navigation"
import { updateEvent } from "./actions"

export const dynamic = "force-dynamic"

export default async function EditEvent({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { clubId } = await requireOrganiser()
  const { id } = await params
  const event = await db.event.findUnique({ where: { id } })
  if (!event || event.clubId !== clubId) notFound()

  return (
    <main className="app-container py-5 sm:py-8">
      <section className="surface mx-auto max-w-2xl rounded-[1.5rem] p-5 sm:p-7">
        <h1 className="text-2xl font-black">Edit event</h1>
        <form action={updateEvent.bind(null, id)} className="mt-4 space-y-3">
          <input
            name="title"
            defaultValue={event.title}
            required
            className="field"
          />
          <select name="eventType" defaultValue={event.eventType ?? ""} required className="field">
            <option value="">Select type</option>
            <option value="ROAD">Road</option>
            <option value="TRAIL">Trail</option>
            <option value="ULTRA">Ultra</option>
            <option value="RELAY">Relay</option>
            <option value="CHARITY">Charity</option>
            <option value="KIDS">Kids</option>
          </select>
          <textarea
            name="description"
            defaultValue={event.description}
            required
            className="field min-h-28"
          />
          <input
            name="startsAt"
            type="datetime-local"
            defaultValue={event.startsAt.toISOString().slice(0, 16)}
            required
            className="field"
          />
          <input
            name="registrationDeadline"
            type="datetime-local"
            defaultValue={event.registrationDeadline?.toISOString().slice(0, 16) ?? ""}
            className="field"
          />
          <input
            name="locationText"
            defaultValue={event.locationText}
            required
            className="field"
          />
          <input
            name="distanceOptions"
            defaultValue={event.distanceOptions.join(", ")}
            required
            className="field"
          />
          <input
            name="expectedRunners"
            type="number"
            min="1"
            defaultValue={event.expectedRunners ?? ""}
            placeholder="Expected runners (optional)"
            className="field"
          />
          <label className="flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              name="hasFinisherMedal"
              defaultChecked={event.hasFinisherMedal}
            />
            Finisher medal awarded
          </label>
          <input
            name="coverImageUrl"
            defaultValue={event.coverImageUrl ?? ""}
            className="field"
          />
          <textarea
            name="paymentInfo"
            defaultValue={event.paymentInfo}
            required
            className="field min-h-24"
          />
          <textarea
            name="logistics"
            defaultValue={event.logistics ?? ""}
            placeholder="Parking, bag storage, water points, cut-off times, medical support... (optional)"
            className="field min-h-24"
          />
          <button className="button-primary">Save</button>
        </form>
      </section>
    </main>
  )
}
```

- [ ] **Step 4: Rewrite `src/app/organiser/events/[id]/edit/actions.ts`**

```ts
"use server"

import { requireOrganiser, saveEvent } from "@/lib/organisers"
import { redirect } from "next/navigation"
import { EventType } from "@prisma/client"

export async function updateEvent(id: string, formData: FormData) {
  const { clubId } = await requireOrganiser()
  const eventType = String(formData.get("eventType") ?? "")
  await saveEvent(
    clubId,
    {
      title: String(formData.get("title")),
      description: String(formData.get("description")),
      startsAt: new Date(String(formData.get("startsAt"))),
      locationText: String(formData.get("locationText")),
      distanceOptions: String(formData.get("distanceOptions"))
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      paymentInfo: String(formData.get("paymentInfo")),
      coverImageUrl: String(formData.get("coverImageUrl") ?? "") || null,
      eventType: eventType in EventType ? (eventType as EventType) : null,
      registrationDeadline: formData.get("registrationDeadline")
        ? new Date(String(formData.get("registrationDeadline")))
        : null,
      expectedRunners: formData.get("expectedRunners")
        ? parseInt(String(formData.get("expectedRunners")), 10)
        : null,
      hasFinisherMedal: formData.get("hasFinisherMedal") === "on",
      logistics: String(formData.get("logistics") ?? "") || null,
    },
    id,
  )
  redirect("/organiser/dashboard")
}
```

- [ ] **Step 5: Verify build passes**

```bash
cd /Users/comfort/Projects/personal/parkrun-zw && npm run build 2>&1 | tail -10
```

Expected: zero TypeScript errors on all organiser form files.

- [ ] **Step 6: Commit** (confirm with user first)

```bash
git add src/app/organiser/events/new/page.tsx src/app/organiser/events/new/actions.ts 'src/app/organiser/events/[id]/edit/page.tsx' 'src/app/organiser/events/[id]/edit/actions.ts'
git commit -m "feat: add event type, deadline, logistics, runners, and medal to organiser forms"
```

---

### Task 4: Event filters and landing page

**Files:**
- Modify: `src/components/EventFilters.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Rewrite `src/components/EventFilters.tsx`**

Add the event type dropdown between Location and From. Desktop grid expands to 5 columns:

```tsx
export function EventFilters({ distances }: { distances: string[] }) {
  return (
    <form
      className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr_0.8fr_0.8fr_auto]"
      method="get"
    >
      <label>
        <span className="field-label">Location</span>
        <input
          name="location"
          placeholder="Harare, Bulawayo..."
          className="field"
        />
      </label>
      <label>
        <span className="field-label">Type</span>
        <select name="eventType" className="field">
          <option value="">Any type</option>
          <option value="ROAD">Road</option>
          <option value="TRAIL">Trail</option>
          <option value="ULTRA">Ultra</option>
          <option value="RELAY">Relay</option>
          <option value="CHARITY">Charity</option>
          <option value="KIDS">Kids</option>
        </select>
      </label>
      <label>
        <span className="field-label">From</span>
        <input type="date" name="from" className="field" />
      </label>
      <label>
        <span className="field-label">Distance</span>
        <select name="distance" className="field">
          <option value="">Any distance</option>
          {distances.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
      <button className="button-primary mt-1 w-full self-end lg:col-span-1">
        Filter events
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Update `src/app/page.tsx`**

Add `eventType` to search params type and pass to `listPublishedEvents`:

```tsx
import Image from "next/image"
import { EventCard } from "@/components/EventCard"
import { EventFilters } from "@/components/EventFilters"
import { listPublishedDistanceOptions, listPublishedEvents } from "@/lib/events"

export const dynamic = "force-dynamic"

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    location?: string
    distance?: string
    from?: string
    eventType?: string
  }>
}) {
  const sp = await searchParams
  const [events, distances] = await Promise.all([
    listPublishedEvents({
      location: sp.location,
      distance: sp.distance,
      from: sp.from ? new Date(sp.from) : undefined,
      eventType: sp.eventType,
    }),
    listPublishedDistanceOptions(),
  ])

  return (
    <main className="app-container py-5 sm:py-8 lg:py-10">
      {/* Hero */}
      <section className="relative min-h-[65vh] overflow-hidden rounded-[1.75rem]">
        <Image
          src="/vic_falls.jpeg"
          alt="Runners at the Econet Asambeni Legends Relay, Zimbabwe"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/[0.72]" />
        <div className="absolute bottom-0 left-0 px-5 pb-8 sm:px-8 sm:pb-10">
          <p className="mb-3 inline-flex rounded-full bg-[rgba(242,184,75,0.9)] px-3 py-1 text-xs font-bold uppercase text-[color:var(--foreground)]">
            Zimbabwe Race Calendar
          </p>
          <h1 className="section-title max-w-2xl font-black text-white">
            Every finish line starts with one decision.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
            Discover running events across Zimbabwe. Register in seconds, no
            password needed.
          </p>
          <a href="#races" className="button-primary mt-6 inline-flex">
            Browse races ↓
          </a>
        </div>
      </section>

      {/* Filters */}
      <section className="mt-5 rounded-[1.5rem] border border-[rgba(24,32,29,0.1)] bg-[rgba(255,255,255,0.58)] p-3 shadow-sm sm:p-4">
        <p className="field-label mb-3">Filter races</p>
        <EventFilters distances={distances} />
      </section>

      {/* Event grid */}
      <div id="races" className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.length === 0 && (
          <p className="rounded-2xl border border-dashed border-[color:var(--line)] bg-white/70 p-5 text-sm text-[color:var(--muted)] md:col-span-2 xl:col-span-3">
            No events yet. Check back soon.
          </p>
        )}
        {events.map((e) => (
          <EventCard key={e.id} e={e} />
        ))}
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Verify build passes**

```bash
cd /Users/comfort/Projects/personal/parkrun-zw && npm run build 2>&1 | tail -10
```

Expected: zero TypeScript errors. `EventCard` compiles unchanged — the events passed to it carry extra fields, which structural typing allows.

- [ ] **Step 4: Commit** (confirm with user first)

```bash
git add src/components/EventFilters.tsx src/app/page.tsx
git commit -m "feat: add event type filter to landing page and EventFilters"
```

---

### Task 5: Event cards

**Files:**
- Modify: `src/components/EventCard.tsx`

- [ ] **Step 1: Rewrite `src/components/EventCard.tsx`**

```tsx
import Link from "next/link"
import { getCountdownLabel } from "@/lib/countdown"

const EVENT_TYPE_LABEL: Record<string, string> = {
  ROAD: "Road",
  TRAIL: "Trail",
  ULTRA: "Ultra",
  RELAY: "Relay",
  CHARITY: "Charity",
  KIDS: "Kids",
}

export function EventCard({
  e,
}: {
  e: {
    id: string
    title: string
    startsAt: Date
    locationText: string
    distanceOptions: string[]
    club: { name: string }
    eventType: string | null
    registrationDeadline: Date | null
    expectedRunners: number | null
    hasFinisherMedal: boolean
  }
}) {
  const date = e.startsAt
  const now = new Date()
  const isPast = e.startsAt < now
  const isRegistrationClosed =
    isPast || (e.registrationDeadline !== null && e.registrationDeadline < now)
  const countdown = getCountdownLabel(date)
  const deadlineCountdown = e.registrationDeadline
    ? getCountdownLabel(e.registrationDeadline)
    : null

  return (
    <Link
      href={`/events/${e.id}`}
      className="group relative flex min-h-64 flex-col overflow-hidden rounded-[1.35rem] border border-[rgba(24,32,29,0.1)] bg-[color:var(--surface-strong)] p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]"
    >
      <div className="absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,var(--teal),var(--mango),var(--coral))]" />

      <div className="flex items-start justify-between gap-3 pt-2">
        {/* Date block */}
        <div className="rounded-2xl bg-[color:var(--foreground)] px-3 py-2 text-center text-white">
          <span className="block text-[0.6rem] font-bold uppercase leading-none text-white/65">
            {date.toLocaleString("en", { weekday: "short" })}
          </span>
          <span className="block text-xs font-bold uppercase text-white/65">
            {date.toLocaleString("en", { month: "short" })}
          </span>
          <span className="block text-2xl font-black leading-none">
            {date.getDate()}
          </span>
        </div>

        {/* Top-right badges */}
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full bg-[rgba(8,127,123,0.1)] px-3 py-1 text-xs font-bold text-[color:var(--teal-dark)]">
            {e.locationText}
          </span>
          {e.eventType && (
            <span className="rounded-full bg-[rgba(8,127,123,0.1)] px-3 py-1 text-xs font-bold text-[color:var(--teal-dark)]">
              {EVENT_TYPE_LABEL[e.eventType]}
            </span>
          )}
          {!isRegistrationClosed && deadlineCountdown && (
            <span className="rounded-full bg-[rgba(220,38,38,0.12)] px-3 py-1 text-xs font-bold text-red-700">
              Closes {deadlineCountdown.toLowerCase()}
            </span>
          )}
          {e.registrationDeadline && !isPast && isRegistrationClosed && (
            <span className="text-xs text-[color:var(--muted)]">
              Registration closed
            </span>
          )}
          {!isRegistrationClosed && countdown && (
            <span className="rounded-full bg-[rgba(242,184,75,0.18)] px-3 py-1 text-xs font-bold text-[color:var(--teal-dark)]">
              {countdown}
            </span>
          )}
        </div>
      </div>

      <h3 className="mt-5 text-xl font-black leading-tight tracking-normal">
        {e.title}
      </h3>
      <p className="mt-1 text-xs text-[color:var(--muted)]">by {e.club.name}</p>
      <p className="mt-2 text-sm text-[color:var(--muted)]">
        {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </p>
      {e.expectedRunners !== null && (
        <p className="mt-1 text-xs text-[color:var(--muted)]">
          ~{e.expectedRunners.toLocaleString()} runners expected
        </p>
      )}
      {e.hasFinisherMedal && (
        <p className="mt-1 text-xs text-[color:var(--muted)]">★ Finisher medal</p>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-6">
        {e.distanceOptions.map((distance) => (
          <span
            key={distance}
            className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs font-bold"
          >
            {distance}
          </span>
        ))}
      </div>

      <span className="mt-5 inline-flex items-center text-sm font-bold text-[color:var(--teal-dark)]">
        View details
        <span className="ml-2 transition group-hover:translate-x-1">→</span>
      </span>
    </Link>
  )
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd /Users/comfort/Projects/personal/parkrun-zw && npm run build 2>&1 | tail -10
```

Expected: zero TypeScript errors.

- [ ] **Step 3: Commit** (confirm with user first)

```bash
git add src/components/EventCard.tsx
git commit -m "feat: add event type badge, registration urgency, runners, and medal to event cards"
```

---

### Task 6: Event detail page

**Files:**
- Modify: `src/app/events/[id]/page.tsx`

- [ ] **Step 1: Rewrite `src/app/events/[id]/page.tsx`**

```tsx
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getEvent } from "@/lib/events"
import { getCountdownLabel } from "@/lib/countdown"

export const dynamic = "force-dynamic"

const EVENT_TYPE_LABEL: Record<string, string> = {
  ROAD: "Road",
  TRAIL: "Trail",
  ULTRA: "Ultra",
  RELAY: "Relay",
  CHARITY: "Charity",
  KIDS: "Kids",
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const e = await getEvent(id)
  if (!e || e.status !== "PUBLISHED") notFound()

  const now = new Date()
  const isPast = e.startsAt < now
  const isRegistrationClosed =
    isPast || (e.registrationDeadline !== null && e.registrationDeadline < now)
  const countdown = getCountdownLabel(e.startsAt)
  const deadlineCountdown = e.registrationDeadline
    ? getCountdownLabel(e.registrationDeadline)
    : null

  return (
    <main className="app-container pt-5 sm:pt-8 pb-24 lg:py-8">
      {/* Hero */}
      <section className="relative min-h-[45vh] overflow-hidden rounded-[1.75rem]">
        {e.coverImageUrl ? (
          <Image
            src={e.coverImageUrl}
            alt={e.title}
            fill
            className="object-cover object-center"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--teal)_0%,var(--teal-dark)_40%,var(--foreground)_100%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/70" />
        <div className="absolute bottom-0 left-0 px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="inline-flex rounded-full bg-[rgba(8,127,123,0.85)] px-3 py-1 text-xs font-bold text-white">
              {e.locationText}
            </span>
            {e.eventType && (
              <span className="inline-flex rounded-full bg-[rgba(8,127,123,0.85)] px-3 py-1 text-xs font-bold text-white">
                {EVENT_TYPE_LABEL[e.eventType]}
              </span>
            )}
            {!isPast && countdown && (
              <span className="inline-flex rounded-full bg-[rgba(242,184,75,0.9)] px-3 py-1 text-xs font-bold text-[color:var(--foreground)]">
                {countdown}
              </span>
            )}
          </div>
          <h1 className="section-title max-w-3xl font-black text-white">
            {e.title}
          </h1>
          <p className="mt-2 text-sm text-white/70">by {e.club.name}</p>
        </div>
      </section>

      {/* Content */}
      <div className="mt-5 gap-5 lg:grid lg:grid-cols-[1fr_20rem]">
        {/* Main column */}
        <div className="space-y-4">
          <div className="surface rounded-[1.5rem] p-5 sm:p-6">
            <h2 className="text-lg font-black">About this race</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[color:var(--muted)]">
              {e.description}
            </p>
          </div>

          <div className="surface rounded-[1.5rem] p-5 sm:p-6">
            <h2 className="text-lg font-black">How to register &amp; pay</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[color:var(--muted)]">
              {e.paymentInfo}
            </p>
          </div>

          {e.logistics && (
            <div className="surface rounded-[1.5rem] p-5 sm:p-6">
              <h2 className="text-lg font-black">Race day info</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[color:var(--muted)]">
                {e.logistics}
              </p>
            </div>
          )}

          {e.lat !== null && e.lng !== null && (
            <div className="surface rounded-[1.5rem] p-5 sm:p-6">
              <h2 className="text-lg font-black">Location</h2>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                {e.locationText}
              </p>
              <a
                href={`https://maps.google.com/?q=${e.lat},${e.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center text-sm font-bold text-[color:var(--teal-dark)]"
              >
                View on Google Maps →
              </a>
            </div>
          )}

          <div className="surface rounded-[1.5rem] p-5 sm:p-6">
            <h2 className="text-lg font-black">Organised by</h2>
            <div className="mt-3 flex items-center gap-3">
              {e.club.logoUrl && (
                <Image
                  src={e.club.logoUrl}
                  width={48}
                  height={48}
                  alt={e.club.name}
                  className="rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-bold">{e.club.name}</p>
                <p className="text-sm text-[color:var(--muted)]">
                  {e.club.contact}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky sidebar — desktop only */}
        <aside className="mt-4 hidden lg:block">
          <div className="surface sticky top-24 rounded-[1.5rem] p-5">
            <p className="text-xs font-bold uppercase text-[color:var(--muted)]">
              {e.startsAt.toLocaleString("en", { weekday: "long" })}
            </p>
            <p className="mt-1 text-2xl font-black">
              {e.startsAt.toLocaleDateString([], {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="text-sm text-[color:var(--muted)]">
              {e.startsAt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {e.distanceOptions.map((d) => (
                <span
                  key={d}
                  className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs font-bold"
                >
                  {d}
                </span>
              ))}
            </div>

            {e.registrationDeadline && (
              <div className="mt-4 text-xs text-[color:var(--muted)]">
                {isRegistrationClosed ? (
                  <p className="font-bold">Registration closed</p>
                ) : (
                  <>
                    <p>
                      Registration closes{" "}
                      {e.registrationDeadline.toLocaleDateString([], {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    {deadlineCountdown && (
                      <span className="mt-1 inline-flex rounded-full bg-[rgba(220,38,38,0.12)] px-2 py-0.5 text-xs font-bold text-red-700">
                        Closes {deadlineCountdown.toLowerCase()}
                      </span>
                    )}
                  </>
                )}
              </div>
            )}

            {e.expectedRunners !== null && (
              <p className="mt-3 text-xs text-[color:var(--muted)]">
                ~{e.expectedRunners.toLocaleString()} runners expected
              </p>
            )}
            {e.hasFinisherMedal && (
              <p className="mt-1 text-xs text-[color:var(--muted)]">
                ★ Finisher medal awarded
              </p>
            )}

            {isRegistrationClosed ? (
              <p className="mt-5 text-center text-sm text-[color:var(--muted)]">
                Registration closed
              </p>
            ) : (
              <Link
                href={`/register/${e.id}`}
                className="button-primary mt-5 block w-full text-center"
              >
                Register
              </Link>
            )}
            <p className="mt-4 text-center text-xs text-[color:var(--muted)]">
              Share: /events/{e.id}
            </p>
          </div>
        </aside>
      </div>

      {/* Mobile sticky register bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-[color:var(--line)] bg-[rgba(251,252,248,0.92)] px-4 py-3 backdrop-blur lg:hidden">
        {isRegistrationClosed ? (
          <p className="text-center text-sm text-[color:var(--muted)]">
            Registration closed
          </p>
        ) : (
          <Link
            href={`/register/${e.id}`}
            className="button-primary block w-full text-center"
          >
            Register
          </Link>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd /Users/comfort/Projects/personal/parkrun-zw && npm run build 2>&1 | tail -10
```

Expected: zero TypeScript errors.

- [ ] **Step 3: Commit** (confirm with user first)

```bash
git add 'src/app/events/[id]/page.tsx'
git commit -m "feat: add event type badge, race day info, deadline, and isRegistrationClosed to event detail page"
```

---

### Task 7: Registration auto-close

**Files:**
- Modify: `src/app/register/[eventId]/page.tsx`

- [ ] **Step 1: Rewrite `src/app/register/[eventId]/page.tsx`**

```tsx
import { getEvent } from "@/lib/events"
import Link from "next/link"
import { notFound } from "next/navigation"
import { submitRegistration } from "./actions"

export const dynamic = "force-dynamic"

export default async function Register({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  const e = await getEvent(eventId)
  if (!e || e.status !== "PUBLISHED") notFound()

  const now = new Date()
  const isPast = e.startsAt < now
  const isRegistrationClosed =
    isPast || (e.registrationDeadline !== null && e.registrationDeadline < now)

  if (isRegistrationClosed) {
    return (
      <main className="app-container py-5 sm:py-8">
        <section className="surface mx-auto max-w-xl rounded-[1.5rem] p-5 sm:p-7">
          <h1 className="text-2xl font-black">Registration closed</h1>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Registration for {e.title} is no longer open.
          </p>
          <Link
            href={`/events/${e.id}`}
            className="button-primary mt-5 inline-flex"
          >
            Back to event
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="app-container py-5 sm:py-8">
      <section className="surface mx-auto max-w-xl rounded-[1.5rem] p-5 sm:p-7">
        <p className="mb-2 text-xs font-bold uppercase text-[color:var(--teal-dark)]">
          Choose your distance
        </p>
        <h1 className="text-2xl font-black leading-tight sm:text-3xl">
          Register for {e.title}
        </h1>
        <form
          action={submitRegistration.bind(null, eventId)}
          className="mt-5 grid gap-3 sm:grid-cols-2"
        >
          {e.distanceOptions.map((d) => (
            <label
              key={d}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[color:var(--line)] bg-white/80 p-4 font-black transition hover:border-[color:var(--teal)]"
            >
              <input type="radio" name="distance" value={d} required /> {d}
            </label>
          ))}
          <button className="button-primary w-full sm:col-span-2">
            Confirm registration
          </button>
        </form>
        <p className="mt-4 rounded-2xl bg-[rgba(242,184,75,0.18)] p-4 text-sm leading-6 text-[color:var(--muted)]">
          Payment: {e.paymentInfo}
        </p>
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Verify full build passes**

```bash
cd /Users/comfort/Projects/personal/parkrun-zw && npm run build 2>&1 | tail -10
```

Expected: all routes compile, zero TypeScript errors.

- [ ] **Step 3: Run existing tests**

```bash
npm run test
```

Expected: all countdown tests still pass (no changes to `src/lib/countdown.ts`).

- [ ] **Step 4: Manual verification checklist**

Run `npm run dev` and verify:

1. `npx prisma migrate dev` was applied — existing events load on `/` without error
2. Organiser form (new): fill all fields including event type, deadline, runners, medal, logistics → save → event created
3. Organiser form (new): leave all optional fields blank → save → event created without error
4. Organiser form (edit): open an existing event → all new fields show with current values → update → saves correctly
5. Filter: select "Trail" → only Trail events shown; "Any type" → all events shown
6. Card: event with `eventType=TRAIL` → "Trail" badge appears top-right
7. Card: event with deadline 3 days away → "Closes 3 days away" red pill appears
8. Card: event with passed deadline (but event not started) → "Registration closed" muted text
9. Card: event with `expectedRunners=500` → "~500 runners expected" shows
10. Card: event with `hasFinisherMedal=true` → "★ Finisher medal" shows
11. Detail page: event with `logistics` set → "Race day info" card appears
12. Detail page: `registrationDeadline` set and open → date + countdown pill shows in sidebar
13. Detail page: `registrationDeadline` past → "Registration closed" in sidebar, mobile bar; Register button hidden
14. Register page (`/register/[id]`): deadline past → "Registration closed" page, no form
15. Register page: no deadline → form renders normally

- [ ] **Step 5: Commit** (confirm with user first)

```bash
git add 'src/app/register/[eventId]/page.tsx'
git commit -m "feat: auto-close registration when deadline passes or event has started"
```

---

## Self-Review

**Spec coverage:**
- `EventType` enum + 5 fields → Task 1 ✅
- `isRegistrationClosed` logic → Tasks 2, 5, 6, 7 ✅
- `EventFilter.eventType` + `buildWhere` → Task 2 ✅
- `EventInput` new fields → Task 2 ✅
- Organiser form (new): 5 new fields in order → Task 3 ✅
- Organiser form (edit): same 5 new fields with `defaultValues` → Task 3 ✅
- `EventFilters`: type dropdown, 5-column grid → Task 4 ✅
- `page.tsx`: `eventType` search param → Task 4 ✅
- `EventCard`: type badge, urgency badge, runners, medal, `isRegistrationClosed` → Task 5 ✅
- `EVENT_TYPE_LABEL` lookup → Task 5 ✅
- Event detail: type badge, race day info card, deadline row, runners, medal, `isRegistrationClosed` → Task 6 ✅
- Registration auto-close → Task 7 ✅

**Type consistency:**
- `EventType` imported from `@prisma/client` in `organisers.ts` (type-only) and as a runtime value in `events.ts` and both action files ✅
- `eventType` validated against the runtime `EventType` enum (`x in EventType`) in `buildWhere` and both actions — invalid URL params or forged form values are ignored instead of crashing Prisma ✅
- `EventInput.eventType` typed as `EventType | null` — matches Prisma's generated type ✅
- `EventCard` prop type includes all 4 new fields — `listPublishedEvents` returns them all via `include: { club: true }` on the full model ✅
- `getEvent` returns full model including new fields — no change needed ✅
- `EVENT_TYPE_LABEL` defined in both `EventCard` and event detail page — same object, same keys ✅

**No placeholders:** all steps contain complete file contents and exact commands.
