# Event Enhancements: Type, Logistics, Registration Deadline, Runners & Medal

**Date:** 2026-07-07
**Status:** Approved

## Goal

Add four groups of fields to the `Event` model to give runners richer information at a glance and to let organisers set a registration deadline that the system enforces automatically.

## Context

Reviewer feedback identified that event cards and detail pages lack key race information runners expect: race type (trail vs road), race-day logistics (parking, water points), registration urgency, expected field size, and finisher medal. All four enhancements use a single Prisma migration and touch the same files — one spec, one plan.

---

## 1. Schema Changes

### New enum

```prisma
enum EventType {
  ROAD
  TRAIL
  ULTRA
  RELAY
  CHARITY
  KIDS
}
```

### New fields on `Event`

```prisma
eventType            EventType?   // optional on existing events; required in organiser form for new ones
logistics            String?      // race-day free text: parking, water points, cut-off times, etc.
registrationDeadline DateTime?    // when registration auto-closes; null = open until event starts
expectedRunners      Int?         // expected field size
hasFinisherMedal     Boolean      @default(false)
```

All new fields are nullable or defaulted — existing rows and seed data require no backfill.

### `isRegistrationClosed` logic

Computed once server-side wherever registration state matters:

```ts
const now = new Date()
const isPast = e.startsAt < now
const isRegistrationClosed =
  isPast || (e.registrationDeadline !== null && e.registrationDeadline < now)
```

`isPast` is kept separate to control the event countdown chip (suppressed when past). `isRegistrationClosed` gates the Register button and the registration page.

---

## 2. Organiser Form

**File:** `src/app/organiser/events/new/page.tsx` + `src/app/organiser/events/new/actions.ts`

Five new fields added to `EventForm`, in this order within the form:

| Field | Input type | Required | Position |
|---|---|---|---|
| Event type | `<select>` | Yes | After title |
| Registration deadline | `datetime-local` | No | After startsAt |
| Expected runners | `number` (min=1) | No | After distanceOptions |
| Finisher medal | `checkbox` | No | After expectedRunners |
| Race day info | `textarea` | No | After paymentInfo |

**Event type select options:** Road, Trail, Ultra, Relay, Charity, Kids (values: `ROAD`, `TRAIL`, `ULTRA`, `RELAY`, `CHARITY`, `KIDS`). Include a default `<option value="">Select type</option>` so the browser enforces required.

**Parsing in `actions.ts`:**

```ts
const eventType = String(formData.get("eventType") ?? "")

// in the saveEvent payload — validated against Prisma's runtime EventType enum:
eventType: eventType in EventType ? (eventType as EventType) : null,
registrationDeadline: formData.get("registrationDeadline")
  ? new Date(String(formData.get("registrationDeadline")))
  : null,
expectedRunners: formData.get("expectedRunners")
  ? parseInt(String(formData.get("expectedRunners")), 10)
  : null,
hasFinisherMedal: formData.get("hasFinisherMedal") === "on",
logistics: (String(formData.get("logistics") ?? "")) || null,
```

**`EventInput` type in `src/lib/organisers.ts`** — add new fields:

```ts
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
```

---

## 3. Event Filters

**File:** `src/components/EventFilters.tsx`

Add an **Event type** dropdown between Location and From date:

- Label: *"Type"*
- Options: Any type (empty value), Road, Trail, Ultra, Relay, Charity, Kids
- `name="eventType"`

Desktop grid changes from 4-column to 5-column:
`lg:grid-cols-[1.1fr_0.9fr_0.8fr_0.8fr_auto]`

**File:** `src/lib/events.ts`

- Add `eventType?: string` to `EventFilter` type
- Add to `buildWhere`, validating against the runtime enum so an invalid URL param is ignored instead of throwing a Prisma error:
  ```ts
  if (f.eventType && f.eventType in EventType) {
    where.eventType = f.eventType as EventType
  }
  ```
- Import `EventType` from `@prisma/client` as a value (Prisma generates a runtime enum object)

**File:** `src/app/page.tsx`

- Read `sp.eventType` from search params
- Pass to `listPublishedEvents({ ..., eventType: sp.eventType })`

---

## 4. Event Cards

**File:** `src/components/EventCard.tsx`

Prop type additions (already returned by `listPublishedEvents` once schema is migrated):
```ts
eventType: string | null
registrationDeadline: Date | null
expectedRunners: number | null
hasFinisherMedal: boolean
```

**Compute at top of component** (EventCard is a server component — `new Date()` is fine):
```ts
const date = e.startsAt
const now = new Date()
const isPast = e.startsAt < now
const isRegistrationClosed =
  isPast || (e.registrationDeadline !== null && e.registrationDeadline < now)
const countdown = getCountdownLabel(date)
```

**Event type humanised labels** (use a lookup object):
```ts
const EVENT_TYPE_LABEL: Record<string, string> = {
  ROAD: "Road", TRAIL: "Trail", ULTRA: "Ultra",
  RELAY: "Relay", CHARITY: "Charity", KIDS: "Kids",
}
```

**Top-right area** — below the existing location badge, stack:
1. Event type badge (if `eventType` is set): teal pill, `EVENT_TYPE_LABEL[e.eventType]`
2. Registration urgency badge (if `registrationDeadline` is set and not yet closed):
   - Uses `getCountdownLabel(e.registrationDeadline)` for the N-days value
   - Label: *"Closes today!"* / *"Closes tomorrow"* / *"Closes this week"* / *"Closes N days away"* (i.e. "Closes " + `getCountdownLabel` output, lowercased)
   - Style: red-tinted pill `bg-[rgba(220,38,38,0.12)] text-red-700`
   - If deadline is past but `!isPast`: show *"Registration closed"* in muted text (no pill)
3. The existing event countdown chip (amber) remains — but only when `!isRegistrationClosed`

**Below the time line**, add (each conditional):
- `expectedRunners`: `<p>~{expectedRunners.toLocaleString()} runners expected</p>` in muted xs text
- `hasFinisherMedal`: `<p>Finisher medal</p>` in muted xs text alongside a simple medal indicator (`★`)

---

## 5. Event Detail Page

**File:** `src/app/events/[id]/page.tsx`

### Hero
- Add `eventType` badge alongside the location badge (same teal pill). Use the same `EVENT_TYPE_LABEL` lookup as EventCard — define it once at the top of the file. Only shown if set.

### `isPast` / `isRegistrationClosed`
Replace the single `isPast` with both values:
```ts
const now = new Date()
const isPast = e.startsAt < now
const isRegistrationClosed =
  isPast || (e.registrationDeadline !== null && e.registrationDeadline < now)
```
- Countdown chip: gated by `!isPast` (unchanged)
- Register button (sidebar + mobile bar): gated by `!isRegistrationClosed`

### Sidebar additions (after distance pills, before Register button)
- **Registration deadline row** (if `e.registrationDeadline` is set):
  - If open: *"Registration closes [formatted date]"* — format as `toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })` — plus `getCountdownLabel(e.registrationDeadline)` as a red pill (`bg-[rgba(220,38,38,0.12)] text-red-700`) with "Closes " prepended (e.g. *"Closes tomorrow"*)
  - If closed: *"Registration closed"* in muted text
- **Expected runners** (if `e.expectedRunners` is set): *"~2,450 runners expected"* in muted xs text
- **Finisher medal** (if `e.hasFinisherMedal`): *"★ Finisher medal awarded"* in muted xs text

### Main column additions
- **"Race day info" card** — inserted between "How to register & pay" and "Location" cards. Only rendered if `e.logistics` is set. Same card style as other cards. Heading: *"Race day info"*. Body: `whitespace-pre-wrap`.

---

## 6. Registration Page Auto-Close

**File:** `src/app/register/[eventId]/page.tsx`

After fetching the event, compute `isRegistrationClosed`. If true, render a closed state instead of the form:

```tsx
if (isRegistrationClosed) {
  return (
    <main className="app-container py-5 sm:py-8">
      <section className="surface mx-auto max-w-xl rounded-[1.5rem] p-5 sm:p-7">
        <h1 className="text-2xl font-black">Registration closed</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Registration for {e.title} is no longer open.
        </p>
        <Link href={`/events/${e.id}`} className="button-primary mt-5 inline-flex">
          Back to event
        </Link>
      </section>
    </main>
  )
}
```

---

## Files Changed

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `EventType` enum + 5 fields on `Event` |
| `src/lib/events.ts` | Add `eventType` to `EventFilter`, `buildWhere`; import `EventType` |
| `src/lib/organisers.ts` | Add new fields to `EventInput` and `saveEvent` |
| `src/app/organiser/events/new/page.tsx` | Add 5 new form fields |
| `src/app/organiser/events/new/actions.ts` | Parse and pass new fields |
| `src/components/EventFilters.tsx` | Add event type dropdown; 5-column desktop grid |
| `src/components/EventCard.tsx` | Type badge, urgency badge, runners, medal |
| `src/app/events/[id]/page.tsx` | Type badge, race day info card, deadline sidebar row, `isRegistrationClosed` |
| `src/app/register/[eventId]/page.tsx` | Auto-close: block registration if `isRegistrationClosed` |
| `src/app/page.tsx` | Pass `eventType` from search params |

## What Does NOT Change

- `src/lib/countdown.ts` — reused as-is for both event countdown and deadline countdown
- Auth flow, OTP, session handling
- Any other page or component

## Testing

Manual verification via `npm run dev`:

1. **Schema**: `npx prisma migrate dev` succeeds; existing events load without error
2. **Organiser form**: create an event with all new fields set; verify saved correctly
3. **Organiser form**: create an event with no optional fields; verify it saves without error
4. **Filter**: select "Trail" → only trail events shown; select "Any type" → all shown
5. **Card**: event with `eventType=TRAIL` shows "Trail" badge; without shows nothing
6. **Card**: event with deadline 3 days away shows "Closes 3 days away" red pill
7. **Card**: event with passed deadline shows "Registration closed" (muted)
8. **Detail page**: `logistics` set → "Race day info" card appears; not set → card absent
9. **Detail page**: `registrationDeadline` past → Register button shows "Registration closed"
10. **Register page**: `registrationDeadline` past → closed state renders; no form shown
11. **Register page**: no deadline → form renders normally
