# Calendar Polish — Design

**Date:** 2026-07-16
**Status:** Approved

## Goal

Complete the "improve" list from reviewer feedback and bring every public event page up to MVP quality: photo galleries with real file upload, public club pages, an embedded map, and race-day weather. Each feature is independently shippable.

## Context

- Next.js 16 (App Router) + Prisma/Postgres + NextAuth OTP, deployed on Vercel.
- Cover images today are pasted URLs (`coverImageUrl` on `Event`). Organisers have no file upload anywhere.
- `Event.lat`/`Event.lng` exist in the schema and drive a "View on Google Maps" link, but the organiser form never captures them — they are null for organiser-created events.
- Club data exists (`Club` model with name, contact, logoUrl, verified) but has no public page.

## Feature 1: Photo uploads via Vercel Blob (shared infrastructure)

- Add `@vercel/blob` (`BLOB_READ_WRITE_TOKEN` env var; auto-provisioned when a Blob store is attached to the Vercel project; token pasted into `.env` for local dev).
- Server-side upload through a server action (multipart form / File from `formData`). Constraints: images only (jpeg/png/webp), max 5 MB, stored under `events/<eventId>/...` with random suffix.
- **Cover image:** the organiser new/edit forms gain a file input for the cover photo. The existing URL-paste field stays as a fallback (upload wins if both provided). Existing events with pasted URLs keep working — `coverImageUrl` remains a plain string URL either way.
- **Gallery:** new model:

  ```prisma
  model EventPhoto {
    id        String  @id @default(cuid())
    eventId   String
    event     Event   @relation(fields: [eventId], references: [id], onDelete: Cascade)
    url       String
    caption   String?
    sortOrder Int     @default(0)
    createdAt DateTime @default(now())
  }
  ```

- Organisers manage gallery photos from the event edit page: upload (multi-file), optional caption, delete. Deleting a photo also deletes the blob (best-effort; DB row is the source of truth).
- Public event page: "Photos" section below event details — responsive thumbnail grid, ordered by `sortOrder` then `createdAt`. Section hidden when empty.
- Cap: 12 photos per event (keeps pages fast and blob usage bounded).

## Feature 2: Club public pages — `/clubs/[id]`

- New route `src/app/clubs/[id]/page.tsx`. Only verified clubs are publicly visible; unverified → `notFound()`.
- Shows: logo (or initial-letter fallback), name, verified badge, contact, upcoming published events (event cards, reusing `EventCard`), and a count of past events.
- Club name on event cards and the event detail page links to the club page.
- No schema changes.

## Feature 3: Coordinates capture → embedded map

- Organiser new/edit forms gain one field: **"Location on map"** — paste a Google Maps link or raw `lat, lng`.
- A pure helper `parseLatLng(input: string): { lat: number; lng: number } | null` in `src/lib/geo.ts` handles:
  - Google Maps URLs containing `@lat,lng` or `?q=lat,lng` / `query=lat,lng`
  - Raw `-17.83, 31.05` style input
  - Returns `null` for anything unparseable (field is optional; invalid input surfaces a form error rather than silently dropping).
- `EventInput` gains `lat`/`lng` (nullable). Edit form pre-fills the field as `lat, lng` when set.
- Public event page: when `lat`/`lng` present, render the free Google Maps iframe embed (`https://maps.google.com/maps?q=<lat>,<lng>&z=14&output=embed`) in the location section, keeping the existing "View on Google Maps" link. No API key. Falls back to text-only location when absent.

## Feature 4: Weather on event pages

- Source: **Open-Meteo** (free, no API key). Daily forecast endpoint with `temperature_2m_max`, `temperature_2m_min`, `weather_code`, `relative_humidity_2m_mean`, `wind_speed_10m_max`, `timezone=Africa/Harare`.
- Shown only when the event has coordinates **and** `startsAt` is within the next 16 days (Open-Meteo's forecast horizon) and not in the past. Otherwise the section renders nothing.
- Server-side fetch with Next.js fetch caching, `revalidate: 10800` (3 h). A fetch failure renders nothing — weather must never break the event page.
- Display: compact "Race-day weather" card next to race-day info — condition icon/label (mapped from WMO weather code), max/min temp, humidity, wind.
- Pure helpers in `src/lib/weather.ts`: WMO code → label mapping, forecast-window check, response parsing — all unit-testable without network.

## Error handling

- Upload: reject non-image or >5 MB with a form error; blob failures surface as form errors, never partial DB writes (create the DB row only after the blob upload succeeds).
- Ownership: all gallery/photo mutations go through the existing `requireOrganiser()` + event-ownership check pattern in `src/lib/organisers.ts`.
- Weather/map: purely additive; any failure or missing data hides the section.

## Testing

Follows the existing pattern (Vitest, pure-function unit tests in `tests/`):

- `geo.test.ts` — `parseLatLng` across URL/raw/garbage inputs.
- `weather.test.ts` — WMO mapping, forecast-window logic, response parsing.
- `events.test.ts` / `organisers.test.ts` additions — photo cap enforcement, ownership checks (mocked db, matching existing style).
- Existing suite must stay green; `npm run lint` and `tsc` clean.

## Build order

1. Blob upload + cover image upload + gallery (biggest piece, shared infra)
2. Club public pages
3. Coordinates capture + map embed
4. Weather

## Out of scope

Results engine, Race Passport/badges, training plans, GPX/elevation, payments, notifications — future phases.
