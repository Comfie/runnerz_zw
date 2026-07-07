# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic landing page with a full-bleed photo hero, inspiring copy, and richer event cards that show countdown, club name, and a clearer date block.

**Architecture:** Three files change — `globals.css` (smooth scroll), `src/app/page.tsx` (hero + filter label + scroll anchor), `src/components/EventCard.tsx` (countdown chip, club name, day name). A new pure-logic utility `src/lib/countdown.ts` handles the countdown label, tested with Vitest.

**Tech Stack:** Next.js App Router (TypeScript) · Tailwind CSS · Vitest · `next/image` (local asset, no config change needed)

**Commit policy:** Every "Commit" step is a suggested checkpoint. Confirm with the user before running `git commit`. Never `--no-verify`. No `Co-authored-by` lines.

---

## File Structure

```
public/
  vic_falls.jpeg              ← copy from ~/Downloads

src/
  app/
    globals.css               ← add html { scroll-behavior: smooth }
    page.tsx                  ← replace hero; add filter label; add id="races" to grid
  components/
    EventCard.tsx             ← countdown chip; club name; day name on date block
  lib/
    countdown.ts              ← pure function getCountdownLabel(startsAt, now?)

tests/
  countdown.test.ts           ← unit tests for getCountdownLabel
```

---

### Task 1: Countdown utility (TDD)

**Files:**
- Create: `src/lib/countdown.ts`
- Create: `tests/countdown.test.ts`

**Interfaces:**
- Produces: `getCountdownLabel(startsAt: Date, now?: Date): string | null`
  - Returns `null` for past events (diff < 0)
  - `"Today!"` when event is calendar-today
  - `"Tomorrow"` for diff === 1
  - `"This week"` for diff 2–7
  - `"{N} days away"` for diff > 7

- [ ] **Step 1: Write the failing test**

Create `tests/countdown.test.ts`:

```typescript
import { describe, it, expect } from "vitest"
import { getCountdownLabel } from "@/lib/countdown"

describe("getCountdownLabel", () => {
  const now = new Date("2026-07-07T12:00:00.000Z")

  it("returns null for a past event", () => {
    expect(getCountdownLabel(new Date("2026-07-06T23:59:59.000Z"), now)).toBeNull()
  })

  it("returns 'Today!' for an event earlier today", () => {
    expect(getCountdownLabel(new Date("2026-07-07T06:00:00.000Z"), now)).toBe("Today!")
  })

  it("returns 'Today!' for an event later today", () => {
    expect(getCountdownLabel(new Date("2026-07-07T22:00:00.000Z"), now)).toBe("Today!")
  })

  it("returns 'Tomorrow' for 1 day away", () => {
    expect(getCountdownLabel(new Date("2026-07-08T08:00:00.000Z"), now)).toBe("Tomorrow")
  })

  it("returns 'This week' for 2 days away", () => {
    expect(getCountdownLabel(new Date("2026-07-09T08:00:00.000Z"), now)).toBe("This week")
  })

  it("returns 'This week' for 7 days away", () => {
    expect(getCountdownLabel(new Date("2026-07-14T08:00:00.000Z"), now)).toBe("This week")
  })

  it("returns '{N} days away' for 8+ days", () => {
    expect(getCountdownLabel(new Date("2026-08-01T08:00:00.000Z"), now)).toBe("25 days away")
  })
})
```

- [ ] **Step 2: Run to confirm it fails**

```bash
npm run test
```
Expected: FAIL — `Cannot find module '@/lib/countdown'`

- [ ] **Step 3: Implement `src/lib/countdown.ts`**

Uses UTC calendar dates to avoid timezone drift — compares midnight-to-midnight so an event at 06:00 and one at 22:00 on the same day both return `"Today!"`.

```typescript
export function getCountdownLabel(startsAt: Date, now = new Date()): string | null {
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const eventUtc = Date.UTC(
    startsAt.getUTCFullYear(),
    startsAt.getUTCMonth(),
    startsAt.getUTCDate(),
  )
  const diff = Math.round((eventUtc - todayUtc) / (1000 * 60 * 60 * 24))
  if (diff < 0) return null
  if (diff === 0) return "Today!"
  if (diff === 1) return "Tomorrow"
  if (diff <= 7) return "This week"
  return `${diff} days away`
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test
```
Expected: all tests PASS including the 7 new countdown cases.

- [ ] **Step 5: Commit checkpoint** (confirm with user first)

```bash
git add src/lib/countdown.ts tests/countdown.test.ts
git commit -m "feat: add countdown utility with full test coverage"
```

---

### Task 2: Photo asset and smooth scroll

**Files:**
- Create: `public/vic_falls.jpeg`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Copy the photo into the project**

```bash
cp ~/Downloads/vic_falls.jpeg public/vic_falls.jpeg
```

Verify it landed: `ls -lh public/vic_falls.jpeg`

- [ ] **Step 2: Add smooth scroll to `globals.css`**

Add `html { scroll-behavior: smooth; }` as the first rule after the `@import` line. The existing `prefers-reduced-motion` block already overrides this with `scroll-behavior: auto !important`, so no extra work needed there.

In `src/app/globals.css`, after line 1 (`@import "tailwindcss";`):

```css
html {
  scroll-behavior: smooth;
}
```

- [ ] **Step 3: Verify**

Run `npm run dev`. Open `http://localhost:3000`. Confirm the image is accessible at `http://localhost:3000/vic_falls.jpeg` and loads in the browser.

---

### Task 3: Hero section, filter label, and scroll anchor

**Files:**
- Modify: `src/app/page.tsx`

Replace the entire `page.tsx` with the following. Key changes from the current file:
- `Image` imported from `next/image`
- Hero `<section>` replaced with full-bleed photo + gradient overlay + text
- Stats widget removed
- Filter section gets a `<p className="field-label mb-3">Filter races</p>` label above `<EventFilters />`
- Event grid `<div>` gets `id="races"` so the hero CTA can scroll to it

- [ ] **Step 1: Replace `src/app/page.tsx`**

```tsx
import Image from "next/image"
import { EventCard } from "@/components/EventCard"
import { EventFilters } from "@/components/EventFilters"
import { listPublishedDistanceOptions, listPublishedEvents } from "@/lib/events"

export const dynamic = "force-dynamic"

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ location?: string; distance?: string; from?: string }>
}) {
  const sp = await searchParams
  const [events, distances] = await Promise.all([
    listPublishedEvents({
      location: sp.location,
      distance: sp.distance,
      from: sp.from ? new Date(sp.from) : undefined,
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
            Discover running events across Zimbabwe. Register in seconds, no password needed.
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

- [ ] **Step 2: Verify**

Run `npm run dev`. Open `http://localhost:3000`.

Expected:
- Full-bleed photo fills the top of the page with rounded corners
- Gradient darkens from top to bottom — Strava overlay in the top-left of the photo is not visible
- Badge, heading, sub-line, and "Browse races ↓" button are readable over the photo
- Clicking "Browse races ↓" smooth-scrolls to the event grid
- "Filter races" label appears above the filter form
- No TypeScript errors (`npm run build` passes if you want to check)

- [ ] **Step 3: Commit checkpoint** (confirm with user first)

```bash
git add public/vic_falls.jpeg src/app/globals.css src/app/page.tsx
git commit -m "feat: replace hero with full-bleed photo and inspiring copy"
```

---

### Task 4: Enrich event cards

**Files:**
- Modify: `src/components/EventCard.tsx`

Three changes:
1. **Prop type** — add `club: { name: string }` (already returned by `listPublishedEvents`)
2. **Date block** — add day-of-week abbreviation (Mon, Tue…) above the existing month + day number
3. **Top-right area** — stack the existing location badge and a new countdown chip (hidden when `null`)
4. **Below title** — add `"by {club.name}"` in muted small text

- [ ] **Step 1: Replace `src/components/EventCard.tsx`**

```tsx
import Link from "next/link"
import { getCountdownLabel } from "@/lib/countdown"

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
  }
}) {
  const date = new Date(e.startsAt)
  const countdown = getCountdownLabel(date)

  return (
    <Link
      href={`/events/${e.id}`}
      className="group relative flex min-h-64 flex-col overflow-hidden rounded-[1.35rem] border border-[rgba(24,32,29,0.1)] bg-[color:var(--surface-strong)] p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]"
    >
      <div className="absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,var(--teal),var(--mango),var(--coral))]" />

      <div className="flex items-start justify-between gap-3 pt-2">
        {/* Date block: day / month / number */}
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

        {/* Location + countdown stacked top-right */}
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full bg-[rgba(8,127,123,0.1)] px-3 py-1 text-xs font-bold text-[color:var(--teal-dark)]">
            {e.locationText}
          </span>
          {countdown && (
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

- [ ] **Step 2: Verify**

Run `npm run dev`. Open `http://localhost:3000`.

Expected:
- Event cards show a 3-line date block: `Mon / Jul / 31`
- Cards with future events show a countdown chip: `"42 days away"`, `"This week"`, `"Tomorrow"`, or `"Today!"`
- Cards with past `startsAt` show no countdown chip
- Club name appears below event title: `"by Harare Road Runners"`
- Hover animation still works (card lifts)
- No TypeScript errors

- [ ] **Step 3: Run all tests**

```bash
npm run test
```

Expected: all tests PASS (including the countdown suite from Task 1).

- [ ] **Step 4: Commit checkpoint** (confirm with user first)

```bash
git add src/components/EventCard.tsx
git commit -m "feat: enrich event cards with countdown, club name, and day-of-week"
```

---

## Self-Review

**Spec coverage:**
- Full-bleed photo hero → Task 3 ✅
- Gradient overlay covering Strava watermark → Task 3 (gradient `to-black/[0.72]`) ✅
- New copy ("Every finish line…") → Task 3 ✅
- Stats widget removed → Task 3 ✅
- Smooth scroll CTA → Tasks 2 + 3 (`scroll-behavior: smooth` + `href="#races"` + `id="races"`) ✅
- Filter label → Task 3 ✅
- Countdown chip → Tasks 1 + 4 ✅
- Club name → Task 4 ✅
- Day name on date block → Task 4 ✅
- No data model changes → confirmed (all fields already in query) ✅

**Type consistency:** `getCountdownLabel` defined in Task 1 and consumed identically in Task 4. `club: { name: string }` added to `EventCard` prop matches what `listPublishedEvents` (which uses `include: { club: true }`) returns.

**No placeholders:** all steps contain complete code and exact commands.
