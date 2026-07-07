# Landing Page Redesign

**Date:** 2026-07-07
**Status:** Approved

## Goal

Replace the current generic-feeling landing page with a visually distinctive, emotionally resonant design that reflects Zimbabwe's running community. The page should inspire rather than list.

## Context

Reviewer feedback: the page currently feels like a directory. Running is emotional. The hero needs a real photo and inspiring copy. Event cards need to show more useful information at a glance (countdown, organiser).

## What Changes

### 1. Hero Section (`src/app/page.tsx`)

**Replace** the current card-based hero with a full-bleed photo hero.

- **Photo:** `public/vic_falls.jpeg` (Econet Asambeni Legends Relay Send Off — user has rights)
- **Height:** `65vh` minimum, `object-cover` so it crops cleanly at all viewport widths
- **Overlay:** gradient from `transparent` at top to `rgba(0,0,0,0.72)` at bottom — this darkens the Strava overlay in the top-left corner naturally and anchors the text
- **Text position:** absolute, bottom-left of the image, with `px-5 pb-8 sm:px-8 sm:pb-10`

**Copy:**
- Badge (amber): *Zimbabwe Race Calendar*
- H1: *"Every finish line starts with one decision."*
- Sub-line: *"Discover running events across Zimbabwe. Register in seconds, no password needed."*
- CTA pill button (teal): *"Browse races ↓"* — anchor link `href="#races"`; smooth scroll enabled by adding `scroll-behavior: smooth` to the `html` selector in `globals.css` (respects the existing `prefers-reduced-motion` override already in the file)

**Remove:**
- The stats widget (Events / Distances / OTP) — confusing to runners, looks bad at zero
- The decorative rotated square element
- The card border/background — the photo is the background

### 2. Filter Section (`src/app/page.tsx`)

Add a small label above the form: *"Filter races"* in the existing `field-label` style. No other changes — the layout fix (removing `sm:grid-cols-2`) already landed in the previous commit.

Add `id="races"` to the event grid `<div>` so the hero CTA scroll anchor works.

### 3. Event Cards (`src/components/EventCard.tsx`)

Three additions, all using data already returned by `listPublishedEvents`:

**a) Countdown chip**
- Position: top-right of card, replaces nothing (new element)
- Logic (server-side, no client JS):
  - `diff = ceil((startsAt - now) / ms_per_day)`
  - `diff < 0`: render nothing (past events)
  - `diff === 0`: *"Today!"*
  - `diff === 1`: *"Tomorrow"*
  - `diff <= 7`: *"This week"*
  - otherwise: *"{diff} days away"*
- Style: small rounded pill, amber background `rgba(242,184,75,0.18)`, amber-dark text

**b) Club name**
- Below the event title: *"by Harare Road Runners"*
- Style: `text-xs text-[color:var(--muted)]`
- Source: `e.club.name` (already included in the query)

**c) Day name on date block**
- Current: month abbreviation + day number
- New: day name (Mon) above month + day number
- Example: `Mon / Jul / 31`
- Source: `date.toLocaleString("en", { weekday: "short" })`

## Files Changed

| File | Change |
|---|---|
| `public/vic_falls.jpeg` | Copy from `~/Downloads/vic_falls.jpeg` |
| `src/app/page.tsx` | Replace hero section; add filter label; add `id="races"` to grid |
| `src/components/EventCard.tsx` | Countdown chip; club name; day name on date block |

## What Does NOT Change

- Filter form fields and behaviour
- Event card hover animation and gradient bar
- Routing, data fetching, auth
- Color palette / CSS variables
- Any other page

## Data Model

No schema changes. All new UI fields come from existing columns:
- Countdown ← `Event.startsAt`
- Club name ← `Event.club.name` (already joined in `listPublishedEvents`)
- Day name ← `Event.startsAt`

## Testing

Manual verification against `npm run dev`:
1. Hero photo fills the section, gradient is readable at all widths
2. CTA button scrolls to the event grid
3. Strava overlay is not visible (covered by gradient)
4. Event cards show countdown, club name, day name
5. Cards with past `startsAt` show no countdown chip
6. Mobile layout looks correct (photo crops well, text is legible)
