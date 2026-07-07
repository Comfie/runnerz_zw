# parkrun-zw v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a PWA where runners in Zimbabwe browse running events with no account and register for them via passwordless OTP, while clubs self-serve their event listings — payment stays off-platform in v1.

**Architecture:** A single full-stack Next.js (App Router) application. Public pages read published events straight from Postgres via Prisma. Registration is gated by a custom email/SMS OTP flow that mints an Auth.js session. Organisers manage their own events; admins seed and moderate. Deployed on Railway alongside Railway Postgres.

**Tech Stack:** Next.js (App Router, TypeScript) · Railway Postgres · Prisma · Auth.js (NextAuth v5, Credentials provider for OTP) · Resend (email) · Twilio (SMS) · Tailwind CSS · Vitest (unit) · manifest-based installable PWA (no service worker in v1). Package manager: **npm**.

## Global Constraints

- **Payment is off-platform in v1.** No payment integration. `Registration.status` must default to `"registered"` and be the only payment-related field (the Phase 2 seam). Do not add payment code.
- **No feature beyond this plan.** No leaderboards, results, GPS, marketplace verticals, or native app. YAGNI.
- **Cheap + low-maintenance.** Prefer managed services and their free tiers. No custom infrastructure.
- **Browsing requires no account.** Only registering (and organiser/admin actions) requires a session.
- **OTP works identically for email and SMS**, both live from day one.
- **Public name is a placeholder.** "parkrun" is trademarked — no user-facing copy may use the word "parkrun". Use the neutral display name `RunZW` in all UI copy until a final name is chosen. The npm package name is `parkrun-zw` (folder only).
- **Commits are checkpoints, not automatic.** The user commits manually. Every "Commit" step below is a suggested checkpoint; at execution time, confirm with the user before running `git commit`. Never `--no-verify`.

---

## File Structure

```
parkrun-zw/
├── prisma/
│   └── schema.prisma            # User, Club, Event, Registration, OtpCode + Auth.js tables
├── src/
│   ├── app/
│   │   ├── layout.tsx           # root layout, PWA meta
│   │   ├── page.tsx             # event list (home)
│   │   ├── events/[id]/page.tsx # event detail + share link
│   │   ├── register/[eventId]/  # registration flow
│   │   ├── me/page.tsx          # my registrations
│   │   ├── signin/page.tsx      # OTP sign-in UI
│   │   ├── organiser/           # organiser apply + dashboard
│   │   ├── admin/               # admin seed/approve/moderate
│   │   └── api/auth/[...nextauth]/route.ts
│   ├── lib/
│   │   ├── db.ts                # Prisma client singleton
│   │   ├── auth.ts              # Auth.js config (Credentials/OTP)
│   │   ├── otp.ts               # generate/verify OTP (pure logic)
│   │   ├── send.ts              # deliver OTP via Resend/Twilio
│   │   ├── events.ts            # event queries + filters
│   │   └── csv.ts               # registrant CSV builder (pure logic)
│   └── components/              # shared UI (EventCard, Filters, etc.)
├── tests/                       # Vitest unit tests for lib/*
├── .env.example
└── next.config.mjs
```

**Testing philosophy for this plan:** write real failing-test → pass cycles for the pure logic in `src/lib/` (`otp.ts`, `csv.ts`, `events.ts` filters, registration rules). For routine pages/forms, the deliverable check is a manual run (`npm run dev`) with a described expected result — do not fabricate brittle UI tests.

---

### Task 1: Project foundation

**Files:**
- Create: `package.json`, `next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`, `.env.example`, `.gitignore`
- Create: `src/lib/db.ts`
- Create: `vitest.config.ts`, `tests/smoke.test.ts`

**Interfaces:**
- Produces: `prisma` client exported from `src/lib/db.ts` as `export const db: PrismaClient`.

- [ ] **Step 1: Scaffold the app**

`create-next-app` refuses to scaffold into a directory with existing content (`docs/` is not on its allowlist — it aborts, there is no "continue" prompt). Move `docs/` aside first:

```bash
cd /c/Users/comfy/Downloads/parkrun-zw
mv docs ../parkrun-zw-docs-tmp
npx create-next-app@latest . --typescript --app --tailwind --eslint --src-dir --import-alias "@/*" --no-turbopack
mv ../parkrun-zw-docs-tmp docs
```
Accept defaults for any prompts.

- [ ] **Step 2: Initialise git**

```bash
git init
git add -A
```
Do NOT commit yet — confirm with the user first (see Global Constraints).

- [ ] **Step 3: Install dependencies**

```bash
npm install @prisma/client next-auth@beta resend twilio
npm install -D prisma vitest @types/node dotenv
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 4: Create the Prisma client singleton**

Create `src/lib/db.ts`:

```typescript
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const db =
  globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
```

- [ ] **Step 5: Configure Vitest and write a smoke test**

Create `vitest.config.ts`. Three non-obvious requirements: the `@` alias must be mapped explicitly (Vitest does not read tsconfig paths — without it every `@/lib/...` import fails); `fileParallelism: false` because DB test files share tables; `setupFiles` enforces the test-database guard below.

```typescript
import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    fileParallelism: false,
  },
})
```

Create `tests/setup.ts` — a hard guard so DB tests can NEVER touch the real database (the test suites wipe tables in `afterAll`):

```typescript
import { config } from "dotenv"

config({ path: ".env.test", override: true })

if (!/test/i.test(process.env.DATABASE_URL ?? "")) {
  throw new Error(
    "Refusing to run tests: DATABASE_URL must come from .env.test and point at a test database (name must contain 'test')."
  )
}
```

Create `tests/smoke.test.ts`:

```typescript
import { describe, it, expect } from "vitest"

describe("smoke", () => {
  it("runs the test harness", () => {
    expect(1 + 1).toBe(2)
  })
})
```

Add to `package.json` scripts: `"test": "vitest run"`.

- [ ] **Step 6: Fill `.env.example` and set local `.env`**

Create `.env.example`:

```
DATABASE_URL="postgresql://USER:PASS@HOST:PORT/DB"
AUTH_SECRET="generate-with: npx auth secret"
RESEND_API_KEY=""
EMAIL_FROM="RunZW <noreply@yourdomain.com>"
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_FROM="+1XXXXXXXXXX"
```
Copy the Railway Postgres connection string into a local `.env` `DATABASE_URL`. Run `npx auth secret` to fill `AUTH_SECRET`.

Also create `.env.test` with `DATABASE_URL` pointing at a **separate test database whose name contains "test"** (a second database on the same Railway Postgres instance, or a local Postgres). The test suites delete all rows in `afterAll` — they must never point at the real database; `tests/setup.ts` refuses to run otherwise.

- [ ] **Step 7: Verify**

```bash
npm run test
npm run dev
```
Expected: test passes; `http://localhost:3000` serves the default Next.js page. Confirm `db` imports without error (it will connect lazily).

- [ ] **Step 8: Commit checkpoint** (confirm with user first)

```bash
git add -A
git commit -m "chore: scaffold Next.js app, Prisma client, Vitest"
```

---

### Task 2: Data model

**Files:**
- Modify: `prisma/schema.prisma`
- Test: `tests/schema.test.ts`

**Interfaces:**
- Produces: Prisma models `User`, `Club`, `Event`, `Registration`, `OtpCode`, plus Auth.js `Account`/`Session`/`VerificationToken`. Enums: `Role { RUNNER ORGANISER ADMIN }`, `EventStatus { DRAFT PUBLISHED }`, `RegistrationStatus { REGISTERED PAID }`.

- [ ] **Step 1: Write the schema**

Replace `prisma/schema.prisma` model section with:

```prisma
generator client {
  provider = "prisma-client-js"
}
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  RUNNER
  ORGANISER
  ADMIN
}

enum EventStatus {
  DRAFT
  PUBLISHED
}

enum RegistrationStatus {
  REGISTERED
  PAID
}

model User {
  id            String         @id @default(cuid())
  name          String
  email         String?        @unique
  phone         String?        @unique
  role          Role           @default(RUNNER)
  clubId        String?
  club          Club?          @relation(fields: [clubId], references: [id])
  registrations Registration[]
  organisedClub Club?          @relation("ClubOwner")
  createdAt     DateTime       @default(now())
}

model Club {
  id        String   @id @default(cuid())
  name      String
  contact   String
  logoUrl   String?
  verified  Boolean  @default(false)
  ownerId   String?  @unique
  owner     User?    @relation("ClubOwner", fields: [ownerId], references: [id])
  members   User[]
  events    Event[]
  createdAt DateTime @default(now())
}

model Event {
  id              String         @id @default(cuid())
  title           String
  description     String
  startsAt        DateTime
  locationText    String
  lat             Float?
  lng             Float?
  distanceOptions String[]       // e.g. ["5k","10k","21k","42k"]
  coverImageUrl   String?
  paymentInfo     String         // free-text: how to register/pay this organiser
  status          EventStatus    @default(DRAFT)
  clubId          String
  club            Club           @relation(fields: [clubId], references: [id])
  registrations   Registration[]
  createdAt       DateTime       @default(now())
}

model Registration {
  id        String             @id @default(cuid())
  userId    String
  user      User               @relation(fields: [userId], references: [id])
  eventId   String
  event     Event              @relation(fields: [eventId], references: [id])
  distance  String
  status    RegistrationStatus @default(REGISTERED)
  createdAt DateTime           @default(now())

  @@unique([userId, eventId]) // one registration per runner per event
}

model OtpCode {
  id        String   @id @default(cuid())
  contact   String   // normalised email or E.164 phone
  codeHash  String
  expiresAt DateTime
  attempts  Int      @default(0)
  consumed  Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([contact])
}
```

- [ ] **Step 2: Create and apply the migration**

```bash
npx prisma migrate dev --name init
```
Expected: migration created and applied to Railway Postgres; `@prisma/client` regenerated.

Also apply the migration to the **test** database (the URL from `.env.test`):

```bash
DATABASE_URL="<test-db-url>" npx prisma migrate deploy
```

- [ ] **Step 3: Write a schema round-trip test**

Create `tests/schema.test.ts`:

```typescript
import { describe, it, expect, afterAll } from "vitest"
import { db } from "@/lib/db"

describe("schema", () => {
  it("creates a club, event, user, registration", async () => {
    const club = await db.club.create({ data: { name: "Test AC", contact: "x@y.z" } })
    const event = await db.event.create({
      data: {
        title: "Test 10k", description: "d", startsAt: new Date(),
        locationText: "Harare", distanceOptions: ["5k", "10k"],
        paymentInfo: "Pay on the day", clubId: club.id, status: "PUBLISHED",
      },
    })
    const user = await db.user.create({ data: { name: "Runner", phone: "+263771234567" } })
    const reg = await db.registration.create({
      data: { userId: user.id, eventId: event.id, distance: "10k" },
    })
    expect(reg.status).toBe("REGISTERED")
  })
  afterAll(async () => {
    await db.registration.deleteMany()
    await db.event.deleteMany()
    await db.user.deleteMany()
    await db.club.deleteMany()
  })
})
```

- [ ] **Step 4: Run the test**

Run: `npm run test tests/schema.test.ts`
Expected: PASS (proves the schema and DB connection work end-to-end).

- [ ] **Step 5: Commit checkpoint** (confirm first)

```bash
git add prisma/ tests/schema.test.ts
git commit -m "feat: add Prisma data model and migration"
```

---

### Task 3: Public event browsing (usable slice #1)

**Files:**
- Create: `src/lib/events.ts`
- Create: `src/components/EventCard.tsx`, `src/components/EventFilters.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/app/events/[id]/page.tsx`
- Test: `tests/events.test.ts`

**Interfaces:**
- Produces: `listPublishedEvents(filter: EventFilter): Promise<Event[]>` and `getEvent(id: string): Promise<Event | null>` from `src/lib/events.ts`, where `EventFilter = { from?: Date; to?: Date; location?: string; distance?: string }`.

- [ ] **Step 1: Write the failing test for the filter query builder**

Create `tests/events.test.ts`. Test the pure filter-to-Prisma-where mapping (extract it as `buildWhere`):

```typescript
import { describe, it, expect } from "vitest"
import { buildWhere } from "@/lib/events"

describe("buildWhere", () => {
  it("always restricts to PUBLISHED", () => {
    expect(buildWhere({}).status).toBe("PUBLISHED")
  })
  it("filters by distance via array contains", () => {
    expect(buildWhere({ distance: "10k" }).distanceOptions).toEqual({ has: "10k" })
  })
  it("filters location case-insensitively", () => {
    expect(buildWhere({ location: "har" }).locationText).toEqual({
      contains: "har", mode: "insensitive",
    })
  })
  it("applies a date lower bound", () => {
    const from = new Date("2026-08-01")
    expect(buildWhere({ from }).startsAt).toEqual({ gte: from })
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm run test tests/events.test.ts`
Expected: FAIL — `buildWhere` not exported.

- [ ] **Step 3: Implement `src/lib/events.ts`**

```typescript
import { db } from "@/lib/db"
import type { Prisma } from "@prisma/client"

export type EventFilter = { from?: Date; to?: Date; location?: string; distance?: string }

export function buildWhere(f: EventFilter): Prisma.EventWhereInput {
  const where: Prisma.EventWhereInput = { status: "PUBLISHED" }
  if (f.distance) where.distanceOptions = { has: f.distance }
  if (f.location) where.locationText = { contains: f.location, mode: "insensitive" }
  if (f.from || f.to) where.startsAt = { ...(f.from && { gte: f.from }), ...(f.to && { lte: f.to }) }
  return where
}

export function listPublishedEvents(f: EventFilter) {
  return db.event.findMany({ where: buildWhere(f), orderBy: { startsAt: "asc" }, include: { club: true } })
}

export function getEvent(id: string) {
  return db.event.findUnique({ where: { id }, include: { club: true } })
}
```

- [ ] **Step 4: Run the test — expect PASS**

Run: `npm run test tests/events.test.ts`
Expected: PASS.

- [ ] **Step 5: Build the EventCard and list page**

Create `src/components/EventCard.tsx`:

```tsx
import Link from "next/link"

export function EventCard({ e }: { e: { id: string; title: string; startsAt: Date; locationText: string; distanceOptions: string[] } }) {
  return (
    <Link href={`/events/${e.id}`} className="block rounded-lg border p-4 hover:shadow">
      <h3 className="font-semibold">{e.title}</h3>
      <p className="text-sm text-gray-600">{new Date(e.startsAt).toLocaleDateString()} · {e.locationText}</p>
      <p className="text-xs text-gray-500">{e.distanceOptions.join(" · ")}</p>
    </Link>
  )
}
```

Replace `src/app/page.tsx`:

```tsx
import { listPublishedEvents } from "@/lib/events"
import { EventCard } from "@/components/EventCard"
import { EventFilters } from "@/components/EventFilters"

export default async function Home({ searchParams }: { searchParams: Promise<{ location?: string; distance?: string; from?: string }> }) {
  const sp = await searchParams
  const events = await listPublishedEvents({
    location: sp.location,
    distance: sp.distance,
    from: sp.from ? new Date(sp.from) : undefined,
  })
  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-2xl font-bold">RunZW — Running events in Zimbabwe</h1>
      <EventFilters />
      <div className="mt-4 space-y-3">
        {events.length === 0 && <p className="text-gray-500">No events yet. Check back soon.</p>}
        {events.map((e) => <EventCard key={e.id} e={e} />)}
      </div>
    </main>
  )
}
```

Create `src/components/EventFilters.tsx` (a simple GET form that sets `?location=&distance=`):

```tsx
export function EventFilters() {
  return (
    <form className="flex flex-wrap gap-2" method="get">
      <input name="location" placeholder="Location" className="rounded border px-2 py-1" />
      <input type="date" name="from" className="rounded border px-2 py-1" />
      <select name="distance" className="rounded border px-2 py-1">
        <option value="">Any distance</option>
        {["5k", "10k", "21k", "42k"].map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
      <button className="rounded bg-black px-3 py-1 text-white">Filter</button>
    </form>
  )
}
```

- [ ] **Step 6: Build the event detail page with share link**

Create `src/app/events/[id]/page.tsx`:

```tsx
import { getEvent } from "@/lib/events"
import { notFound } from "next/navigation"
import Link from "next/link"

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const e = await getEvent(id)
  if (!e || e.status !== "PUBLISHED") notFound()
  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-bold">{e.title}</h1>
      <p className="text-gray-600">{new Date(e.startsAt).toLocaleString()} · {e.locationText}</p>
      <p className="mt-1 text-sm">Distances: {e.distanceOptions.join(", ")}</p>
      <p className="mt-4 whitespace-pre-wrap">{e.description}</p>
      <div className="mt-4 rounded bg-gray-50 p-3 text-sm">
        <strong>How to register / pay:</strong>
        <p className="whitespace-pre-wrap">{e.paymentInfo}</p>
      </div>
      <Link href={`/register/${e.id}`} className="mt-6 inline-block rounded bg-black px-4 py-2 text-white">Register</Link>
      <p className="mt-3 text-xs text-gray-500">Share this event: /events/{e.id}</p>
    </main>
  )
}
```

- [ ] **Step 7: Verify manually**

Seed a published event via `npx prisma studio` (or reuse the schema test data), then run `npm run dev`.
Expected: home page lists the event, filters narrow it, clicking opens the detail page with a Register button and the payment note. `/events/<bad-id>` returns 404.

- [ ] **Step 8: Commit checkpoint** (confirm first)

```bash
git add src/lib/events.ts src/components src/app/page.tsx src/app/events tests/events.test.ts
git commit -m "feat: public event browsing and detail pages"
```

---

### Task 4: Passwordless OTP authentication (email + SMS)

**Files:**
- Create: `src/lib/otp.ts` (pure logic), `src/lib/send.ts` (delivery), `src/lib/auth.ts` (Auth.js config)
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/app/signin/page.tsx`, `src/app/signin/SignInForm.tsx`, `src/app/signin/actions.ts`
- Test: `tests/otp.test.ts`

**Interfaces:**
- Produces from `src/lib/otp.ts`: `normaliseContact(raw: string): { contact: string; channel: "email" | "sms" }`, `generateCode(): string` (6 digits), `hashCode(code: string): string`, `verifyCode(input: string, hash: string): boolean`.
- Produces from `src/lib/send.ts`: `sendOtp(contact: string, channel: "email" | "sms", code: string): Promise<void>`.
- Produces from `src/lib/auth.ts`: `auth`, `signIn`, `signOut`, `handlers`. Session `user.id` and `user.role` are available.
- Produces server actions in `src/app/signin/actions.ts`: `requestOtp(formData)`, and sign-in completes via Auth.js `signIn("otp", { contact, code })`.

- [ ] **Step 1: Write failing tests for OTP logic**

Create `tests/otp.test.ts`:

```typescript
import { describe, it, expect } from "vitest"
import { normaliseContact, generateCode, hashCode, verifyCode } from "@/lib/otp"

describe("normaliseContact", () => {
  it("detects email and lowercases", () => {
    expect(normaliseContact("Foo@Bar.com")).toEqual({ contact: "foo@bar.com", channel: "email" })
  })
  it("treats digits as an E.164 Zimbabwe phone", () => {
    expect(normaliseContact("0771234567")).toEqual({ contact: "+263771234567", channel: "sms" })
  })
  it("keeps an already-E.164 number", () => {
    expect(normaliseContact("+263771234567").contact).toBe("+263771234567")
  })
})

describe("code", () => {
  it("generates a 6-digit numeric code", () => {
    expect(generateCode()).toMatch(/^\d{6}$/)
  })
  it("verifies a hashed code and rejects a wrong one", () => {
    const h = hashCode("123456")
    expect(verifyCode("123456", h)).toBe(true)
    expect(verifyCode("000000", h)).toBe(false)
  })
})
```

- [ ] **Step 2: Run to confirm failure**

Run: `npm run test tests/otp.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/otp.ts`**

```typescript
import { createHash, randomInt } from "node:crypto"

export function normaliseContact(raw: string): { contact: string; channel: "email" | "sms" } {
  const v = raw.trim()
  if (v.includes("@")) return { contact: v.toLowerCase(), channel: "email" }
  const digits = v.replace(/[^\d+]/g, "")
  if (digits.startsWith("+")) return { contact: digits, channel: "sms" }
  const local = digits.replace(/^0/, "")
  return { contact: `+263${local}`, channel: "sms" }
}

export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0")
}

export function hashCode(code: string): string {
  return createHash("sha256").update(`${code}:${process.env.AUTH_SECRET}`).digest("hex")
}

export function verifyCode(input: string, hash: string): boolean {
  return hashCode(input) === hash
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `npm run test tests/otp.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement delivery `src/lib/send.ts`**

```typescript
import { Resend } from "resend"
import twilio from "twilio"

export async function sendOtp(contact: string, channel: "email" | "sms", code: string): Promise<void> {
  const body = `Your RunZW verification code is ${code}. It expires in 10 minutes.`
  if (channel === "email") {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({ from: process.env.EMAIL_FROM!, to: contact, subject: "Your RunZW code", text: body })
  } else {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    await client.messages.create({ from: process.env.TWILIO_FROM, to: contact, body })
  }
}
```

- [ ] **Step 6: Implement Auth.js config `src/lib/auth.ts`**

Uses a Credentials provider that verifies the latest unconsumed OTP for the contact, enforces expiry and a 5-attempt cap, then upserts the user.

```typescript
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { normaliseContact, verifyCode } from "@/lib/otp"

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      id: "otp",
      credentials: { contact: {}, code: {}, name: {} },
      async authorize(creds) {
        const { contact } = normaliseContact(String(creds?.contact ?? ""))
        const code = String(creds?.code ?? "")
        const otp = await db.otpCode.findFirst({
          where: { contact, consumed: false }, orderBy: { createdAt: "desc" },
        })
        if (!otp || otp.expiresAt < new Date() || otp.attempts >= 5) return null
        if (!verifyCode(code, otp.codeHash)) {
          await db.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } })
          return null
        }
        await db.otpCode.update({ where: { id: otp.id }, data: { consumed: true } })
        const isEmail = contact.includes("@")
        const user = await db.user.upsert({
          where: isEmail ? { email: contact } : { phone: contact },
          update: {},
          create: { name: String(creds?.name ?? "Runner"), ...(isEmail ? { email: contact } : { phone: contact }) },
        })
        // `as any`: `role` is not on NextAuth's User type; strict excess-property
        // checking would fail `next build`. Consumed by the jwt callback below.
        return { id: user.id, name: user.name, role: user.role } as any
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) { if (user) { token.uid = (user as any).id; token.role = (user as any).role } return token },
    session({ session, token }) { (session.user as any).id = token.uid; (session.user as any).role = token.role; return session },
  },
})
```

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/lib/auth"
export const { GET, POST } = handlers
```

- [ ] **Step 7: Build request-OTP action + sign-in UI**

Create `src/app/signin/actions.ts`:

```typescript
"use server"
import { db } from "@/lib/db"
import { normaliseContact, generateCode, hashCode } from "@/lib/otp"
import { sendOtp } from "@/lib/send"

export async function requestOtp(formData: FormData) {
  const { contact, channel } = normaliseContact(String(formData.get("contact") ?? ""))
  // v1 is Zimbabwe-only: refuse non-+263 SMS. This alone kills most SMS-pumping
  // fraud (bots requesting paid OTP SMS to premium-rate foreign numbers).
  if (channel === "sms" && !contact.startsWith("+263")) {
    return { error: "Please use a Zimbabwean phone number or an email address." }
  }
  // Abuse guard: 60s cooldown per contact, max 5 codes per hour.
  const now = Date.now()
  const justSent = await db.otpCode.count({
    where: { contact, createdAt: { gt: new Date(now - 60_000) } },
  })
  if (justSent > 0) return { error: "Code already sent — wait a minute before retrying." }
  const lastHour = await db.otpCode.count({
    where: { contact, createdAt: { gt: new Date(now - 3_600_000) } },
  })
  if (lastHour >= 5) return { error: "Too many codes requested. Try again later." }

  const code = generateCode()
  await db.otpCode.create({
    data: { contact, codeHash: hashCode(code), expiresAt: new Date(now + 10 * 60_000) },
  })
  await sendOtp(contact, channel, code)
  return { contact }
}
```

(The sign-in form must show `error` when returned instead of advancing to the code step.)

Create `src/app/signin/page.tsx` (server component that wraps the form in `Suspense` — required because the form reads `useSearchParams`, which fails `next build` on a statically-prerendered page without a Suspense boundary) and `src/app/signin/SignInForm.tsx` (client). Step 1 calls `requestOtp`; step 2 calls `signIn("otp", { contact, code, name, redirectTo })`. `redirectTo` comes from the `?redirectTo=` query param so a runner sent here mid-registration lands back on the event they were registering for — not on an empty `/me`.

`src/app/signin/page.tsx`:

```tsx
import { Suspense } from "react"
import { SignInForm } from "./SignInForm"

export default function SignIn() {
  return (
    <main className="mx-auto max-w-sm p-4">
      <Suspense>
        <SignInForm />
      </Suspense>
    </main>
  )
}
```

`src/app/signin/SignInForm.tsx`:

```tsx
"use client"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { requestOtp } from "./actions"

export function SignInForm() {
  const [contact, setContact] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const redirectTo = useSearchParams().get("redirectTo") ?? "/me"
  return (
    <>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      {!sent ? (
        <form action={async (fd) => {
          const r = await requestOtp(fd)
          if ("error" in r && r.error) { setError(r.error); return }
          setError(null); setContact(r.contact!); setSent(true)
        }} className="space-y-2">
          <input name="contact" placeholder="Email or phone" required className="w-full rounded border px-2 py-1" />
          <button className="w-full rounded bg-black py-2 text-white">Send code</button>
        </form>
      ) : (
        <form onSubmit={async (ev) => {
          ev.preventDefault()
          const fd = new FormData(ev.currentTarget)
          await signIn("otp", { contact, code: fd.get("code"), name: fd.get("name"), redirectTo })
        }} className="space-y-2">
          <input name="name" placeholder="Your name" required className="w-full rounded border px-2 py-1" />
          <input name="code" placeholder="6-digit code" required className="w-full rounded border px-2 py-1" />
          <button className="w-full rounded bg-black py-2 text-white">Verify</button>
        </form>
      )}
    </>
  )
}
```

- [ ] **Step 8: Verify manually**

With `RESEND_API_KEY` set, run `npm run dev`, go to `/signin`, enter your email, receive the code, verify → lands on `/me` with a session. Repeat with a phone number (Twilio) if credentials are set. If a provider key is missing, that channel throws — expected until keys are added.

- [ ] **Step 9: Commit checkpoint** (confirm first)

```bash
git add src/lib/otp.ts src/lib/send.ts src/lib/auth.ts src/app/api src/app/signin tests/otp.test.ts
git commit -m "feat: passwordless email/SMS OTP auth"
```

---

### Task 5: Registration flow

**Files:**
- Create: `src/lib/registrations.ts`
- Create: `src/app/register/[eventId]/page.tsx`, `src/app/register/[eventId]/actions.ts`
- Create: `src/app/me/page.tsx`
- Test: `tests/registrations.test.ts`

**Interfaces:**
- Consumes: `auth` from `src/lib/auth.ts`, `getEvent` from `src/lib/events.ts`.
- Produces: `registerForEvent(userId: string, eventId: string, distance: string): Promise<Registration>` from `src/lib/registrations.ts`. Throws `Error("invalid distance")` if the distance is not offered; is idempotent per (user,event) via upsert.

- [ ] **Step 1: Write failing tests for registration rules**

Create `tests/registrations.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { db } from "@/lib/db"
import { registerForEvent } from "@/lib/registrations"

let userId: string, eventId: string
beforeAll(async () => {
  const club = await db.club.create({ data: { name: "C", contact: "c" } })
  const e = await db.event.create({ data: { title: "E", description: "d", startsAt: new Date(), locationText: "H", distanceOptions: ["5k","10k"], paymentInfo: "p", clubId: club.id, status: "PUBLISHED" } })
  const u = await db.user.create({ data: { name: "R", phone: "+263770000000" } })
  eventId = e.id; userId = u.id
})
afterAll(async () => { await db.registration.deleteMany(); await db.event.deleteMany(); await db.user.deleteMany(); await db.club.deleteMany() })

describe("registerForEvent", () => {
  it("creates a REGISTERED registration for a valid distance", async () => {
    const r = await registerForEvent(userId, eventId, "10k")
    expect(r.status).toBe("REGISTERED")
    expect(r.distance).toBe("10k")
  })
  it("is idempotent — re-registering updates, does not duplicate", async () => {
    await registerForEvent(userId, eventId, "5k")
    const count = await db.registration.count({ where: { userId, eventId } })
    expect(count).toBe(1)
  })
  it("rejects a distance the event does not offer", async () => {
    await expect(registerForEvent(userId, eventId, "42k")).rejects.toThrow("invalid distance")
  })
})
```

- [ ] **Step 2: Run to confirm failure**

Run: `npm run test tests/registrations.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/registrations.ts`**

```typescript
import { db } from "@/lib/db"

export async function registerForEvent(userId: string, eventId: string, distance: string) {
  const event = await db.event.findUnique({ where: { id: eventId } })
  if (!event || event.status !== "PUBLISHED") throw new Error("event not available")
  if (!event.distanceOptions.includes(distance)) throw new Error("invalid distance")
  return db.registration.upsert({
    where: { userId_eventId: { userId, eventId } },
    update: { distance },
    create: { userId, eventId, distance },
  })
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `npm run test tests/registrations.test.ts`
Expected: PASS.

- [ ] **Step 5: Build the register page + action (auth-gated)**

Create `src/app/register/[eventId]/actions.ts`:

```typescript
"use server"
import { auth } from "@/lib/auth"
import { registerForEvent } from "@/lib/registrations"
import { redirect } from "next/navigation"

export async function submitRegistration(eventId: string, formData: FormData) {
  const session = await auth()
  // Preserve registration context through sign-in: after OTP the runner
  // returns here instead of landing on an empty /me.
  if (!session?.user) redirect(`/signin?redirectTo=/register/${eventId}`)
  await registerForEvent((session.user as any).id, eventId, String(formData.get("distance")))
  redirect(`/me`)
}
```

Create `src/app/register/[eventId]/page.tsx` — shows the event's distances as radio options and posts to `submitRegistration`. If not signed in, the action redirects to `/signin`.

```tsx
import { getEvent } from "@/lib/events"
import { submitRegistration } from "./actions"
import { notFound } from "next/navigation"

export default async function Register({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const e = await getEvent(eventId)
  if (!e || e.status !== "PUBLISHED") notFound()
  return (
    <main className="mx-auto max-w-sm p-4">
      <h1 className="text-xl font-bold">Register: {e.title}</h1>
      <form action={submitRegistration.bind(null, eventId)} className="mt-4 space-y-2">
        {e.distanceOptions.map((d) => (
          <label key={d} className="block"><input type="radio" name="distance" value={d} required /> {d}</label>
        ))}
        <button className="w-full rounded bg-black py-2 text-white">Confirm registration</button>
      </form>
      <p className="mt-3 text-sm text-gray-600">Payment: {e.paymentInfo}</p>
    </main>
  )
}
```

- [ ] **Step 6: Build `/me` (my registrations)**

Create `src/app/me/page.tsx`:

```tsx
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"

export default async function Me() {
  const session = await auth()
  if (!session?.user) redirect("/signin")
  const regs = await db.registration.findMany({ where: { userId: (session.user as any).id }, include: { event: true } })
  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="text-xl font-bold">My registrations</h1>
      <ul className="mt-4 space-y-2">
        {regs.map((r) => <li key={r.id} className="rounded border p-3">{r.event.title} — {r.distance} ({r.status})</li>)}
        {regs.length === 0 && <p className="text-gray-500">You haven't registered for anything yet.</p>}
      </ul>
    </main>
  )
}
```

- [ ] **Step 7: Verify manually**

Run `npm run dev`. As a signed-out user, click Register on an event → redirected to `/signin` → after OTP, complete registration → see it on `/me`. Re-register a different distance → `/me` shows the updated distance, not a duplicate.

- [ ] **Step 8: Commit checkpoint** (confirm first)

```bash
git add src/lib/registrations.ts src/app/register src/app/me tests/registrations.test.ts
git commit -m "feat: event registration flow and my-registrations"
```

---

### Task 6: Organiser application, approval, and event management

**Files:**
- Create: `src/lib/organisers.ts`
- Create: `src/app/organiser/apply/page.tsx` + `actions.ts`
- Create: `src/app/organiser/dashboard/page.tsx`, `src/app/organiser/events/new/page.tsx` + `actions.ts`, `src/app/organiser/events/[id]/edit/page.tsx`
- Create: `src/app/organiser/profile/page.tsx` + `actions.ts`
- Test: `tests/organisers.test.ts`

**Interfaces:**
- Consumes: `auth`.
- Produces from `src/lib/organisers.ts`: `applyAsOrganiser(userId, clubName, contact): Promise<Club>` (creates an unverified club owned by the user, sets role ORGANISER), `requireOrganiser(): Promise<{userId,clubId}>` (throws/redirects if not an approved organiser), `saveEvent(clubId, data, id?)` (create, or update — updates only the owning club's event), `setEventStatus(eventId, clubId, status)` (only the owning club may publish). Also a `updateClubProfile` server action for the club profile page.

- [ ] **Step 1: Write failing tests for the publish-gating rule**

Create `tests/organisers.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { db } from "@/lib/db"
import { setEventStatus, saveEvent } from "@/lib/organisers"

let clubId: string, otherClubId: string, eventId: string
beforeAll(async () => {
  const club = await db.club.create({ data: { name: "Owner AC", contact: "o", verified: true } })
  const other = await db.club.create({ data: { name: "Other AC", contact: "x", verified: true } })
  const e = await db.event.create({ data: { title: "E", description: "d", startsAt: new Date(), locationText: "H", distanceOptions: ["5k"], paymentInfo: "p", clubId: club.id } })
  clubId = club.id; otherClubId = other.id; eventId = e.id
})
afterAll(async () => { await db.event.deleteMany(); await db.club.deleteMany() })

describe("setEventStatus", () => {
  it("lets the owning club publish", async () => {
    const e = await setEventStatus(eventId, clubId, "PUBLISHED")
    expect(e.status).toBe("PUBLISHED")
  })
  it("refuses a club that does not own the event", async () => {
    await expect(setEventStatus(eventId, otherClubId, "DRAFT")).rejects.toThrow("not your event")
  })
})

describe("saveEvent", () => {
  it("refuses to update an event the club does not own", async () => {
    await expect(
      saveEvent(otherClubId, { title: "X", description: "d", startsAt: new Date(), locationText: "H", distanceOptions: ["5k"], paymentInfo: "p" }, eventId)
    ).rejects.toThrow("not your event")
  })
})
```

- [ ] **Step 2: Run to confirm failure**

Run: `npm run test tests/organisers.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/organisers.ts`**

```typescript
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function applyAsOrganiser(userId: string, clubName: string, contact: string) {
  const club = await db.club.create({ data: { name: clubName, contact, ownerId: userId, verified: false } })
  await db.user.update({ where: { id: userId }, data: { role: "ORGANISER", clubId: club.id } })
  return club
}

export async function requireOrganiser(): Promise<{ userId: string; clubId: string }> {
  const session = await auth()
  const userId = (session?.user as any)?.id
  if (!userId) redirect("/signin")
  const club = await db.club.findUnique({ where: { ownerId: userId } })
  if (!club || !club.verified) redirect("/organiser/pending")
  return { userId, clubId: club.id }
}

type EventInput = { title: string; description: string; startsAt: Date; locationText: string; distanceOptions: string[]; paymentInfo: string; coverImageUrl?: string }

export async function saveEvent(clubId: string, data: EventInput, id?: string) {
  if (id) {
    // Ownership check — without it any organiser could edit any club's event
    const existing = await db.event.findUnique({ where: { id } })
    if (!existing || existing.clubId !== clubId) throw new Error("not your event")
    return db.event.update({ where: { id }, data })
  }
  return db.event.create({ data: { ...data, clubId } })
}

export async function setEventStatus(eventId: string, clubId: string, status: "DRAFT" | "PUBLISHED") {
  const event = await db.event.findUnique({ where: { id: eventId } })
  if (!event || event.clubId !== clubId) throw new Error("not your event")
  return db.event.update({ where: { id: eventId }, data: { status } })
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `npm run test tests/organisers.test.ts`
Expected: PASS.

- [ ] **Step 5: Build apply page + pending page**

Create `src/app/organiser/apply/actions.ts` (calls `applyAsOrganiser` with the session user) and `src/app/organiser/apply/page.tsx` (form: club name + contact). Create a trivial `src/app/organiser/pending/page.tsx` that says "Your club is awaiting approval." Guard the action with `auth()` → redirect to `/signin` if signed out.

```typescript
// src/app/organiser/apply/actions.ts
"use server"
import { auth } from "@/lib/auth"
import { applyAsOrganiser } from "@/lib/organisers"
import { redirect } from "next/navigation"

export async function submitApplication(formData: FormData) {
  const session = await auth()
  if (!session?.user) redirect("/signin")
  await applyAsOrganiser((session.user as any).id, String(formData.get("clubName")), String(formData.get("contact")))
  redirect("/organiser/pending")
}
```

- [ ] **Step 6: Build the dashboard + new/edit event forms**

Create `src/app/organiser/dashboard/page.tsx` — calls `requireOrganiser()`, lists that club's events with edit links and a publish/unpublish button (calls a `setEventStatus`-backed action). Create `src/app/organiser/events/new/page.tsx` + `actions.ts` (form → `saveEvent`) and `.../[id]/edit/page.tsx` (same form, pre-filled). The distance field is a comma-separated input parsed to `string[]`.

```typescript
// src/app/organiser/events/new/actions.ts
"use server"
import { requireOrganiser, saveEvent } from "@/lib/organisers"
import { redirect } from "next/navigation"

export async function createEvent(formData: FormData) {
  const { clubId } = await requireOrganiser()
  await saveEvent(clubId, {
    title: String(formData.get("title")),
    description: String(formData.get("description")),
    startsAt: new Date(String(formData.get("startsAt"))),
    locationText: String(formData.get("locationText")),
    distanceOptions: String(formData.get("distanceOptions")).split(",").map((s) => s.trim()).filter(Boolean),
    paymentInfo: String(formData.get("paymentInfo")),
  })
  redirect("/organiser/dashboard")
}
```

Also create the club profile page (spec §6 Organiser #4): `src/app/organiser/profile/page.tsx` — a form pre-filled with the club's name, contact, and logo URL (pasted URL, consistent with the cover-image decision) — backed by `src/app/organiser/profile/actions.ts`:

```typescript
// src/app/organiser/profile/actions.ts
"use server"
import { requireOrganiser } from "@/lib/organisers"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"

export async function updateClubProfile(formData: FormData) {
  const { clubId } = await requireOrganiser()
  await db.club.update({
    where: { id: clubId },
    data: {
      name: String(formData.get("name")),
      contact: String(formData.get("contact")),
      logoUrl: String(formData.get("logoUrl") ?? "") || null,
    },
  })
  redirect("/organiser/dashboard")
}
```

- [ ] **Step 7: Verify manually**

Sign in, apply as organiser → pending. Manually flip the club's `verified = true` in `npx prisma studio` (admin approval is Task 8). Reload dashboard → create an event (draft) → publish it → confirm it now appears on the public home page. Try publishing via a different account — blocked.

- [ ] **Step 8: Commit checkpoint** (confirm first)

```bash
git add src/lib/organisers.ts src/app/organiser tests/organisers.test.ts
git commit -m "feat: organiser application and event management"
```

---

### Task 7: Organiser registrations view + CSV export

**Files:**
- Create: `src/lib/csv.ts` (pure logic)
- Create: `src/app/organiser/events/[id]/registrations/page.tsx`
- Create: `src/app/organiser/events/[id]/registrations/export/route.ts`
- Test: `tests/csv.test.ts`

**Interfaces:**
- Consumes: `requireOrganiser`.
- Produces from `src/lib/csv.ts`: `toCsv(rows: { name: string; contact: string; distance: string; status: string; registeredAt: string }[]): string` with a header row and RFC-4180 quoting.

- [ ] **Step 1: Write failing tests for CSV building**

Create `tests/csv.test.ts`:

```typescript
import { describe, it, expect } from "vitest"
import { toCsv } from "@/lib/csv"

describe("toCsv", () => {
  it("emits a header and a row", () => {
    const out = toCsv([{ name: "Ann", contact: "a@x.z", distance: "10k", status: "REGISTERED", registeredAt: "2026-07-07" }])
    expect(out.split("\n")[0]).toBe("Name,Contact,Distance,Status,Registered At")
    expect(out).toContain("Ann,a@x.z,10k,REGISTERED,2026-07-07")
  })
  it("quotes fields containing commas", () => {
    const out = toCsv([{ name: "Doe, John", contact: "j", distance: "5k", status: "REGISTERED", registeredAt: "d" }])
    expect(out).toContain('"Doe, John"')
  })
})
```

- [ ] **Step 2: Run to confirm failure**

Run: `npm run test tests/csv.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/csv.ts`**

```typescript
type Row = { name: string; contact: string; distance: string; status: string; registeredAt: string }

function esc(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCsv(rows: Row[]): string {
  const header = "Name,Contact,Distance,Status,Registered At"
  const lines = rows.map((r) => [r.name, r.contact, r.distance, r.status, r.registeredAt].map(esc).join(","))
  return [header, ...lines].join("\n")
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `npm run test tests/csv.test.ts`
Expected: PASS.

- [ ] **Step 5: Build the registrations view**

Create `src/app/organiser/events/[id]/registrations/page.tsx` — calls `requireOrganiser()`, verifies the event belongs to the club, lists registrants (name, contact = email ?? phone, distance, status) with a link to the export route.

- [ ] **Step 6: Build the CSV export route**

Create `src/app/organiser/events/[id]/registrations/export/route.ts`:

```typescript
import { requireOrganiser } from "@/lib/organisers"
import { db } from "@/lib/db"
import { toCsv } from "@/lib/csv"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { clubId } = await requireOrganiser()
  const { id } = await params
  const event = await db.event.findUnique({ where: { id }, include: { registrations: { include: { user: true } } } })
  if (!event || event.clubId !== clubId) return new Response("Not found", { status: 404 })
  const csv = toCsv(event.registrations.map((r) => ({
    name: r.user.name, contact: r.user.email ?? r.user.phone ?? "", distance: r.distance,
    status: r.status, registeredAt: r.createdAt.toISOString().slice(0, 10),
  })))
  // Sanitize: a raw title with quotes or non-ASCII chars throws
  // "Invalid character in header content" at runtime (500 on export)
  const safeName = event.title.replace(/[^\w-]+/g, "_")
  return new Response(csv, {
    headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="${safeName}-registrations.csv"` },
  })
}
```

- [ ] **Step 7: Verify manually**

As an approved organiser with a published event and at least one registration, open the registrations page → see the runner → click export → a CSV downloads with the correct rows. Confirm another club's organiser gets 404.

- [ ] **Step 8: Commit checkpoint** (confirm first)

```bash
git add src/lib/csv.ts src/app/organiser/events tests/csv.test.ts
git commit -m "feat: organiser registrations view and CSV export"
```

---

### Task 8: Admin panel (seed, approve, moderate)

**Files:**
- Create: `src/lib/admin.ts`
- Create: `src/app/admin/page.tsx` + `actions.ts`

**Interfaces:**
- Consumes: `auth`.
- Produces from `src/lib/admin.ts`: `requireAdmin()`, `approveClub(clubId)`, `setEventStatusAsAdmin(eventId, status)`. Event seeding reuses `saveEvent` from `organisers.ts`; club creation is a `createClub` server action in `src/app/admin/actions.ts`.

- [ ] **Step 1: Implement admin guard + actions `src/lib/admin.ts`**

```typescript
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function requireAdmin(): Promise<string> {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (!session?.user) redirect("/signin")
  if (role !== "ADMIN") redirect("/")
  return (session.user as any).id
}

export function approveClub(clubId: string) {
  return db.club.update({ where: { id: clubId }, data: { verified: true } })
}

export function setEventStatusAsAdmin(eventId: string, status: "DRAFT" | "PUBLISHED") {
  return db.event.update({ where: { id: eventId }, data: { status } })
}
```

- [ ] **Step 2: Build the admin dashboard**

Create `src/app/admin/page.tsx` — calls `requireAdmin()`, shows: pending clubs (with an Approve button → `approveClub`), all events (with publish/unpublish → `setEventStatusAsAdmin`), a minimal "Create club" form (name + contact → `db.club.create({ data: { name, contact, verified: true } })` — without this, day-one seeding requires Prisma Studio because clubs otherwise only exist via organiser applications), and a "Seed event" form (choose club, fill event fields, reuses `saveEvent` from `organisers.ts`). Wire each button/form to a server action in `src/app/admin/actions.ts` that re-checks `requireAdmin()`.

- [ ] **Step 3: Deliberately no middleware**

Do NOT create `src/middleware.ts`. Re-exporting `auth` as middleware would pull `@/lib/auth` → PrismaClient into the Edge runtime, which fails at build/runtime; and a bare `auth` middleware doesn't redirect unauthenticated users anyway. The route-level guards (`requireAdmin`, `requireOrganiser`, and `auth()` checks in pages/actions) are the sole and sufficient protection.

- [ ] **Step 4: Bootstrap the first admin**

Since role defaults to RUNNER, promote your own user once via Prisma Studio or a one-off script:
```bash
npx prisma studio   # set your User.role = ADMIN
```
Document this in the README as the admin bootstrap step.

- [ ] **Step 5: Verify manually**

As admin: approve a pending club → that organiser's dashboard unlocks. Seed an event and publish it → appears on home. Unpublish an event → disappears from home. As a non-admin, `/admin` redirects to `/`.

- [ ] **Step 6: Commit checkpoint** (confirm first)

```bash
git add src/lib/admin.ts src/app/admin
git commit -m "feat: admin panel for seeding, approval, moderation"
```

---

### Task 9: PWA (installable) + deploy config

**Files:**
- Create: `public/manifest.webmanifest`, app icons under `public/`
- Modify: `src/app/layout.tsx` (manifest + theme meta)
- Create: `README.md` (setup + Railway deploy + admin bootstrap notes)

**Interfaces:** none (integration task).

- [ ] **Step 1: Add the web manifest**

Create `public/manifest.webmanifest`:

```json
{
  "name": "RunZW",
  "short_name": "RunZW",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```
Add placeholder `icon-192.png` and `icon-512.png` to `public/` (any square PNG for now).

- [ ] **Step 2: Reference the manifest in the root layout**

In `src/app/layout.tsx`, export metadata including `manifest: "/manifest.webmanifest"` and a `themeColor`. Add a simple header nav (Home · Sign in / My registrations) so the app is navigable.

- [ ] **Step 3: No service worker (deliberate)**

Skip service workers entirely: Chrome/Android installability requires only a valid manifest + icons (the service-worker requirement was dropped in 2024), and the spec goal is installability, not offline support. Zero extra dependencies, zero maintenance. If offline caching is ever wanted later, add `@serwist/next` then.

- [ ] **Step 4: Write the README**

Document: env vars (`.env.example`), `npx prisma migrate dev`, `npm run dev`, how to deploy on Railway (add a service from the repo, set env vars, add the Postgres plugin, run `prisma migrate deploy` on release), and the **admin bootstrap** step from Task 8.

- [ ] **Step 5: Verify**

```bash
npm run build && npm run start
```
Open in Chrome → DevTools → Application → Manifest shows RunZW and an "Install" affordance appears. Lighthouse PWA check passes installability.

- [ ] **Step 6: Deploy to Railway**

Create a Railway project, add the Postgres plugin (or reuse the existing DB), add a service from the git repo, set all env vars from `.env.example`, and set the release command to `npx prisma migrate deploy`. Confirm the deployed URL serves the event list.

- [ ] **Step 7: Commit checkpoint** (confirm first)

```bash
git add public/ src/app/layout.tsx README.md
git commit -m "feat: PWA manifest, README and deploy config"
```

---

## Self-Review (against the spec)

**Spec coverage:**
- Discover events (public, no account) → Task 3 ✅
- Register via OTP (email + SMS) → Tasks 4, 5 ✅
- Passwordless, frictionless, verified → Task 4 (custom OTP, no passwords) ✅
- Organiser self-serve (create/edit/publish, registrations, CSV) → Tasks 6, 7 ✅
- Admin seed/approve/moderate → Task 8 ✅
- Hybrid supply (admin seed + organiser self-serve) → Tasks 6, 8 ✅
- Shareable event links → Task 3 (detail page share line) ✅
- PWA installable → Task 9 ✅
- Payment seam (`Registration.status`) reserved, no payment code → Task 2 (enum), enforced by Global Constraints ✅
- Stack: Next.js + Railway Postgres + Prisma + Auth.js + Resend + Twilio → Tasks 1, 4, 9 ✅
- Cheap/low-maintenance → managed services, no custom infra ✅

**Deferred (correctly absent):** payments/tollgate, leaderboards, results, GPS, marketplace verticals, native app.

**Type consistency:** `Registration.status` enum values `REGISTERED`/`PAID` used consistently; `distanceOptions: string[]` with `{ has }` filter matches; `requireOrganiser()` returns `{userId, clubId}` and is consumed as such in Tasks 6/7; `setEventStatus(eventId, clubId, status)` signature consistent between definition (Task 6) and test (Task 6).

**Open items flagged, not silently resolved:** SMS provider choice (Twilio placeholder), file storage for cover images (URL field only in v1 — no upload widget built; organisers paste a URL, matching "keep minimal"), final public product name (RunZW placeholder), EcoCash (Phase 2, out of scope).

**Known v1 simplification:** cover image is a pasted URL, not an upload — deliberate, to avoid a storage integration in v1. Note for the user in case they want uploads sooner.

---

## Review fixes applied (2026-07-07, independent review pass)

An independent review of this plan surfaced 15 findings; all are now fixed inline. The load-bearing ones, so executors understand why the plan insists on certain details:

1. Prisma enums reformatted multi-line (single-line enum blocks are a PSL parse error — migration would fail).
2. Tests now run against a **dedicated test database** via `.env.test`, with a hard guard in `tests/setup.ts` and `fileParallelism: false` — previously unfiltered `deleteMany()` would have wiped the real Railway DB.
3. **No middleware** (was: `export { auth as middleware }`) — it pulls Prisma into the Edge runtime and breaks all protected routes; route-level guards are the protection.
4. `requestOtp` gained abuse guards (+263-only SMS, 60s cooldown, 5/hour cap) — it sends paid SMS and was an open wallet.
5. Vitest `@` alias mapped explicitly (Vitest ignores tsconfig paths — every test import would have failed).
6. Sign-in now threads `?redirectTo=` so a mid-registration runner returns to the event after OTP (was: dumped on `/me`, breaking the spec's core flow).
7. `saveEvent` update path now checks ownership (was: any organiser could edit any club's event).
8. `create-next-app` scaffolding works around the existing `docs/` dir (it aborts, doesn't prompt).
9. Service worker dropped entirely — manifest + icons suffice for installability; Serwist step was a placeholder.
10. Added the spec's organiser **club profile** page and the **date filter** input (both silently missing); admin gained a "Create club" form so seeding never requires Prisma Studio; CSV export filename sanitized; `authorize` return cast documented.
