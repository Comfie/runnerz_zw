# parkrun-zw — v1 Design Spec

**Date:** 2026-07-07
**Status:** Draft for review
**Working name:** `parkrun-zw` (see Open Questions — the public name must change; "parkrun" is trademarked)

---

## 1. Summary

A platform that becomes **the go-to place to discover and register for running events in
Zimbabwe**. v1 is deliberately narrow: a complete, trustworthy directory of running events
that runners can browse freely and register for in a few taps. Payment is handled
off-platform in v1; bringing payment onto the platform is the future monetisation
"tollgate" (Phase 2), not part of this build.

The wedge is **event discovery + registration**. Everything else the wider vision describes
(leaderboards, results, travel, accommodation, gear, physios, sports scientists, event
management tooling) is explicitly deferred to later phases.

## 2. Goals & Non-Goals

### v1 Goals
- Runners can browse all published running events with **no account required**.
- Runners can register for an event (pick a distance) via **passwordless OTP** (email or SMS).
- Organisers (clubs / event owners) can **self-serve**: create, edit, and publish their own
  events, and see/export who has registered.
- Admins (Comfort + Dad) can **seed events quickly**, approve organisers, and moderate.
- Every event has a **shareable deep link** for WhatsApp/club-group distribution.
- Installable **PWA** — feels like an app, works on every phone and desktop.
- **Cheap to run and near-zero maintenance** (hard constraint: solo dev with a day job).

### Explicit Non-Goals (deferred to later phases)
- On-platform payments / the EcoCash tollgate (Phase 2).
- Leaderboards, race results, GPS/activity tracking.
- Marketplace verticals: travel, accommodation, gear, physios, sports scientists.
- Native iOS/Android app (PWA now; native later once adoption justifies it).

## 3. Phasing

| Phase | Scope | Monetisation |
|-------|-------|--------------|
| **Phase 1 (this spec)** | Discover + register. Payment off-platform. | None — acquire clubs & runners. |
| **Phase 2 (the tollgate)** | EcoCash **facilitator** payment on-platform + club listing/premium fees. | Small fee per registration + club fees. |
| **Later** | Leaderboards, results, ecosystem verticals, native app. | New verticals. |

The v1 registration flow is designed with a **payment seam** (`Registration.status`) so Phase 2
EcoCash slots in without rebuilding the core.

**Payment model (Phase 2, for context):** *facilitator* — money goes directly to the
organiser's own merchant account; the platform confirms payment and takes a small service
fee. The platform does **not** hold funds (avoids money-handling licensing until volume
justifies it).

## 4. Roles

- **Runner** — browses events (no account). To register, verifies via OTP (email or phone);
  their verified contact *is* their lightweight account. No passwords.
- **Organiser** — a club or event owner. Applies for an account (admin-approved), then
  self-serves their events and registrations.
- **Admin** — Comfort + Dad. Seeds events, approves organisers, moderates/unpublishes,
  sees everything. Kept deliberately minimal (a 2-minute job).

## 5. Data Model (deliberately small)

- **User** — `id`, `name`, `email` (nullable), `phone` (nullable), `role`
  (runner / organiser / admin), `clubId` (nullable), verified-contact info, timestamps.
  At least one of email/phone required and verified via OTP.
- **Club / Organiser** — `id`, `name`, `contact`, `logo` (optional), `verified` flag,
  timestamps.
- **Event** — `id`, `title`, `description`, `startsAt` (date/time), `location` (text +
  optional lat/lng), `distanceOptions` (e.g. 5k/10k/21k/42k), `organiserId`,
  `coverImage` (optional), `paymentInfo` (free-text: "how to register/pay this organiser"),
  `status` (draft / published), timestamps.
- **Registration** — `id`, `userId`, `eventId`, `distance`, `status`
  (`registered` → Phase 2: `paid`), `createdAt`. **`status` is the payment seam.**

## 6. Screens & Flows

### Runner
1. **Event list / home** — all published events; filter by date, location, distance.
   Public, no login.
2. **Event detail** — full info, cover image, distances, location/map, organiser's
   free-text "how to register/pay" note, **Register** button, **shareable link**.
3. **Register** — pick distance → enter name + email *or* phone → OTP code → confirmation.
4. **My registrations** — events the runner signed up for (re-access via OTP).

### Organiser
1. **Apply / sign up** → admin approval.
2. **Dashboard** — create / edit / publish events (draft until ready).
3. **Registrations view** — who's registered per event + distance; **CSV export** for race day.
4. **Club profile** — name, logo, contact.

### Admin
- Seed events quickly; approve organisers; unpublish/moderate; see everything.

### Cross-cutting
- Installable **PWA**.
- **Deep link per event** for WhatsApp sharing (the primary growth channel).
- `Registration.status` reserved as the Phase 2 payment seam.

## 7. Technical Approach

- **Framework:** Next.js (App Router) — full-stack: PWA frontend + backend (server
  actions / API routes) in one app, one language (TypeScript).
- **Database:** **Postgres on Railway** (developer's existing comfort zone).
- **ORM:** Prisma.
- **Auth:** Auth.js (NextAuth) configured for **passwordless OTP**, delivered by:
  - **Email** via Resend (free tier).
  - **SMS** via Twilio or a local Zimbabwean SMS aggregator (small per-message cost;
    accepted for v1). Both channels live from day one.
- **Hosting:** Deploy the Next.js app on **Railway** too — single platform, less to juggle.
- **File storage:** event cover images — Railway volume or a cheap object store; keep minimal.
- **Cost target:** roughly a few dollars/month plus per-SMS cost until real traffic.

Rationale: cheapest to run, least to maintain, fastest to build, and does not paint us into a
corner on the native app or the Phase 2 EcoCash tollgate. React Native/Expo can later reuse
this same backend for the native app.

## 8. Growth / Cold-Start

Hybrid supply: **admin-seed** a handful of events (from Comfort's & Dad's own club network) so
the directory looks complete and alive on day one — the single biggest factor in whether a
discovery product succeeds — then push organisers onto **self-serve** early so the founder is
not the data-entry bottleneck (respects the time constraint). Distribution is via
**shareable event links in WhatsApp club groups**.

Key assets: Dad is an active marathoner *inside* the Zimbabwe running clubs (domain access +
credibility) and a senior manager at Econet (distribution + the eventual EcoCash relationship
for Phase 2).

## 9. Open Questions / Risks

1. **Public name / trademark.** "parkrun" is a registered trademark (parkrun Global Ltd,
   already operating across Africa). `parkrun-zw` is fine as a local folder/working name but
   **the public product name must be distinct** before any launch. Pick a name early.
2. **Market/monetisation validation.** The "runners spend big" thesis is proven in wealthy
   markets; validate it holds for *Zimbabwe's* running economy before investing in Phase 2
   verticals. Recommended: talk to 5–10 clubs before/while building.
3. **SMS provider choice.** Twilio (works, per-SMS cost) vs a local Zim aggregator (possibly
   cheaper/better deliverability). To decide during build.
4. **File storage.** Confirm Railway volume vs object store for event images.
5. **EcoCash API access (Phase 2).** Confirm whether EcoCash offers a merchant/developer API
   and what access Dad's Econet position can secure — determines Phase 2 shape.

## 10. Success Criteria for v1

- A runner can go from a shared WhatsApp link to a confirmed registration in under a minute,
  on a phone, with no password.
- An organiser can list an event and export their registrant list without help.
- The directory shows real, current Zimbabwe events on day one.
- Runs at near-zero cost and needs no daily attention from the founder.
