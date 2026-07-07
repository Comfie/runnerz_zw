# Event Detail Page Redesign

**Date:** 2026-07-07
**Status:** Approved

## Goal

Replace the bare v1 event detail page with an emotionally engaging, conversion-focused layout that features a cover image hero, always-visible register button, full race info, and club attribution — matching the energy of the redesigned landing page.

## Context

This is the page runners land on when a race link is shared. The current layout is functional but generic: a gradient bar, title/description card, and a small register button buried at the bottom. The redesign uses data already in the model — no schema changes needed.

## What Changes

**Only one file changes:** `src/app/events/[id]/page.tsx`

All data is already returned by `getEvent(id)` which uses `include: { club: true }`.

---

### 1. Hero Section

- **Height:** `min-h-[45vh]` — shorter than the landing page hero, appropriate for a detail page
- **Image:** if `e.coverImageUrl` is set, render `<Image src={e.coverImageUrl} fill className="object-cover object-center" alt={e.title} />` — requires `next.config.ts` to allow external image hostnames (see Implementation Notes)
- **Fallback:** if `coverImageUrl` is null, render a dark gradient: `bg-[linear-gradient(135deg,var(--teal)_0%,var(--teal-dark)_40%,var(--foreground)_100%)]` filling the same container
- **Overlay:** `absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/70` — same pattern as landing page
- **Text (absolute bottom-left, `px-5 pb-6 sm:px-8 sm:pb-8`):**
  - Location badge (teal pill): `e.locationText`
  - Countdown chip (amber pill): `getCountdownLabel(e.startsAt)` — hidden if `null`
  - H1: `e.title` — white, `section-title font-black`
  - Club line: *"by {e.club.name}"* — `text-sm text-white/70`
- **Remove:** the existing `h-3` gradient bar — the hero replaces it

---

### 2. Content Layout

Two-column grid on desktop (`lg:grid-cols-[1fr_20rem]`), single column on mobile. Sits below the hero with `mt-5`.

#### Main Column

Three cards stacked vertically (`space-y-4`), each using `.surface rounded-[1.5rem] p-5 sm:p-6`:

**a) About this race**
- Heading: `"About this race"`
- Body: `e.description` with `whitespace-pre-wrap text-sm leading-7 text-[color:var(--muted)]`

**b) How to register & pay**
- Heading: `"How to register & pay"`
- Body: `e.paymentInfo` with `whitespace-pre-wrap text-sm leading-6 text-[color:var(--muted)]`

**c) Location** *(conditional — only rendered if `e.lat && e.lng`)*
- Heading: `"Location"`
- Content: `e.locationText` as a label, then an `<a>` link to `https://maps.google.com/?q=${e.lat},${e.lng}` opening in a new tab (`target="_blank" rel="noopener noreferrer"`) with text *"View on Google Maps →"*

**d) Organiser**
- Heading: `"Organised by"`
- Club logo: if `e.club.logoUrl` is set, render `<Image src={e.club.logoUrl} width={48} height={48} alt={e.club.name} className="rounded-full" />` — same external hostname caveat as cover image
- Club name: `e.club.name` in bold
- Contact: `e.club.contact` in muted small text

#### Sticky Sidebar (desktop only, `hidden lg:block`)

Uses `sticky top-24` so it stays visible as the user scrolls.

Content (single `.surface rounded-[1.5rem] p-5` card):
- **Full date block:**
  - Weekday: `startsAt.toLocaleString("en", { weekday: "long" })` (e.g. *Thursday*)
  - Date: `startsAt.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" })` (e.g. *31 July 2026*)
  - Time: `startsAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })` (e.g. *06:00 AM*)
- **Distances:** pills using same style as EventCard (`rounded-full border border-[color:var(--line)] px-3 py-1 text-xs font-bold`), wrapped in `flex flex-wrap gap-2 mt-4`
- **Register button** *(conditional on event not being past):*
  - If `e.startsAt > now`: `<Link href={/register/${e.id}} className="button-primary w-full mt-5 block text-center">Register</Link>`
  - If past: `<p className="mt-5 text-center text-sm text-[color:var(--muted)]">Registration closed</p>`
- **Share line:** `<p className="mt-4 text-xs text-[color:var(--muted)] text-center">Share: /events/{e.id}</p>`

---

### 3. Mobile Sticky Register Bar (`lg:hidden`)

A `fixed bottom-0 left-0 right-0` bar, only shown when on mobile (hidden at `lg`):

- Background: `bg-[rgba(251,252,248,0.92)] backdrop-blur border-t border-[color:var(--line)]`
- Padding: `px-4 py-3`
- Content: single `button-primary w-full` linking to `/register/${e.id}`
- **Past events:** replace the button with a muted *"Registration closed"* line — same conditional as sidebar

To prevent the bar from covering page content, add `pb-24 lg:pb-0` to the `<main>` element.

The `now` value used for the past-event check is `new Date()` computed once at the top of the component (server-rendered, no client JS needed).

---

## Implementation Notes

### External images (`next.config.ts`)

`next/image` rejects external `src` URLs unless the hostname is whitelisted. Since organisers paste arbitrary URLs in v1, add a permissive `remotePatterns` entry to `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
}
```

This is acceptable for v1 — images are only set by verified organisers. Tighten to specific hostnames in v2 when a storage provider is chosen.

### `getCountdownLabel` import

Import from `@/lib/countdown` — already exists, no changes needed.

### `now` for past-event check

```ts
const now = new Date()
const isPast = e.startsAt < now
```

Computed once at the top of the component, used for both the sidebar and the mobile bar.

---

## Files Changed

| File | Change |
|---|---|
| `src/app/events/[id]/page.tsx` | Full redesign |
| `next.config.ts` | Add `images.remotePatterns` for external cover images |

## What Does NOT Change

- `src/lib/events.ts` — `getEvent` already fetches club and all needed fields
- `src/lib/countdown.ts` — reused as-is
- Schema — no new fields
- Any other page or component

## Testing

Manual verification against `npm run dev`:
1. Event with `coverImageUrl` set → hero shows the photo
2. Event without `coverImageUrl` → hero shows the teal-to-dark gradient fallback
3. Future event → countdown chip appears in hero, Register button/bar active
4. Past event → no countdown chip, both sidebar and mobile bar show "Registration closed"
5. Event with `lat`/`lng` → Location card shows with Google Maps link
6. Event without `lat`/`lng` → Location card absent
7. On mobile: sticky bar pins to bottom, page content not obscured
8. On desktop: sidebar stays sticky as description scrolls
