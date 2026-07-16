# Homepage redesign v2 — GoMiles-inspired, Zimbabwe-flag palette

## Context

Transform RunZW's look toward the GoMiles ThemeForest template (screenshots
reviewed against the live template preview). Two references were compared:

- **Runer** — black/white/red-orange/dark-navy, heavy condensed all-caps
  headlines, sharp-edged cards. A marketing brochure site for a single club;
  poor structural fit for a multi-event directory/results platform.
- **GoMiles** — off-white background, lime-green/orange/cobalt accents, bold
  all-caps headlines with an italicized accent phrase, rounded cards, a hero
  with a floating "Upcoming Event" accordion, alternating white/photo feature
  cards, and event cards with capacity counts and registration CTAs. Much
  closer structural fit: it already models "event card with date/type/location
  + CTA", which is what RunZW's `EventCard` does.

**Decision: GoMiles' layout language, with a Zimbabwe-flag-inspired accent
palette (green / gold / red / near-black) instead of GoMiles'
lime/orange/cobalt.** Gold takes over the role GoMiles gives lime: the
high-energy CTA color carrying **dark** text.

### Product-direction constraints (from stakeholder discussion)

The platform's roadmap extends beyond a race calendar: service providers
(sports doctors, physios, nutritionists), leaderboards, payments/ticketing,
and potentially other disciplines. This pass does **not** build any of that,
but the homepage must not paint us into a corner:

- Header must accommodate 3–4 future nav items without redesign.
- Feature-card copy must stay true after organiser types expand beyond clubs.
- Event cards should reserve layout space for a future registered-count /
  capacity badge (GoMiles' "473/1000" pattern) without a redesign.

## Scope

Homepage (`src/app/page.tsx`), plus shared pieces it depends on:

- `src/app/globals.css` — design tokens, button/field primitives
- `src/components/AppHeader.tsx`
- `src/components/EventFilters.tsx`
- `src/components/EventCard.tsx`
- `src/app/page.tsx` — hero (incl. new upcoming-events accordion card), new
  "Why RunZW" section, filters, event grid
- **`src/components/AppFooter.tsx` (new)** — minimal dark footer *(scope
  change from v1: a footer is now in scope; see Footer section)*
- `src/app/layout.tsx` — `theme-color` meta update
- Favicon / logo SVG — recolor teal → green

Because `AppHeader`, `EventCard`, `AppFooter`, and the button/field primitives
are shared across the whole app, this pass will visually affect other pages
too (expected and desirable — it's the foundation for later passes). No other
page templates are being restructured in this pass.

**Out of scope:** events detail page, clubs pages, admin/organiser pages, auth
pages restructuring, any new data/schema changes (e.g. real capacity counts),
new photography, social-proof / testimonial / FAQ sections (parked for phase 2
once real numbers exist).

## Design tokens (`globals.css`)

Replace the current teal/coral/mango/leaf palette and radial-gradient
background texture with:

```css
--background: #f5f4ef;      /* warm off-white */
--foreground: #14171a;      /* near-black */
--surface: #ffffff;
--line: #e2e0d8;
--muted: #666b66;
--green: #1e8e3e;           /* accent — tints, badges, icons, large text */
--green-dark: #166b2f;      /* green that carries white text (6.6:1) */
--gold: #f2b705;            /* CTA / highlight — ALWAYS dark text */
--red: #d2262f;             /* urgent accent — passes AA on white (5.2:1) */
```

`--surface-strong` is **removed** (it duplicated `--surface`); elevation is
expressed with shadow, not a second white.

`body::before` background texture (radial gradient + diagonal lines) is
removed in favor of a flat off-white background.

### Contrast rules (hard constraints, not verification-phase checks)

| Combination                        | Ratio  | Rule                                   |
|------------------------------------|--------|----------------------------------------|
| White text on `--gold`             | ~1.8:1 | **Forbidden.** Gold always gets `--foreground` text. |
| White text on `--green` (#1e8e3e)  | ~4.2:1 | Fails AA for normal text. Use `--green-dark` fills for white text, or reserve `--green` for large/bold display text and non-text UI. |
| White text on `--green-dark`       | ~6.6:1 | OK everywhere.                          |
| White text on `--red`              | ~5.2:1 | OK.                                     |
| `--green` text on white            | ~4.2:1 | Large/bold text only; body text uses `--green-dark`. |

### Buttons

- `.button-primary`: solid **gold** pill, `--foreground` bold text, dark
  circular arrow badge on the right. (This mirrors GoMiles' lime CTA — the
  hero "LET'S START YOUR MILES" pattern — and is the highest-energy button.)
- `.button-secondary`: solid near-black pill, white text, white arrow badge
  (GoMiles' CONTACT / JOIN THE COMMUNITY style).
- `.button-tertiary` (optional, where a quieter green action is needed):
  solid `--green-dark` pill, white text.

### Typography

No new font import — keep Geist Sans. The GoMiles headline effect =
**all-caps + heaviest weight + italic accent phrase**.

- New class **`.hero-title`**: `font-black`, uppercase, tight line-height,
  `clamp(2.25rem, 1.5rem + 4vw, 5.5rem)`. Used on the homepage hero only.
- **`.section-title` is left at its current scale** *(change from v1: bumping
  the shared class would silently resize headings on every page — the hero
  gets its own class instead)*. It may adopt `font-black` + uppercase for
  consistency, but not the larger clamp.
- **Italic accent phrase — conditional.** Verify the `next/font` Geist config
  actually ships a true italic. If yes: accent phrase in italic (GoMiles'
  "MORE PACING" treatment). If no: do **not** allow synthetic faux-oblique at
  display sizes; instead set the accent phrase in `--gold` (dark-on-photo
  contexts get a subtle text-shadow or the phrase moves onto the gradient
  band). Decision recorded in code comment either way.

### Cards

Border radius `1.5rem`–`1.75rem`. New `.divider-dashed` utility (dashed 1px
border-top) for use between a card's title/heading and its meta/detail rows —
this exact pattern appears inside GoMiles' hero accordion card.

## Header (`AppHeader.tsx`)

Structural no-op for rendered items, but **layout must be nav-ready**: the bar
uses a three-zone flex layout (logo | nav-item slot group | CTA) so that
Events / Clubs / (later Services, Leaderboards) links can be added without
rework. Currently the middle zone renders nothing (or just Events if it
already exists).

Visual:

- Logo mark: circular badge recolored teal → `--green`
- Sign-in CTA picks up `.button-secondary` (dark pill — matches GoMiles'
  CONTACT button)
- Bar: clean white, crisp `--line` bottom border, no backdrop-blur tint

## Hero (`page.tsx`)

Keep the existing full-bleed photo (`vic_falls.jpeg`) + gradient overlay.

- Badge ("Zimbabwe Race Calendar"): white pill with a small gold asterisk/
  star mark (GoMiles' "Every mile has a reason." chip pattern), or gold pill
  with dark text — implementer's choice, dark text either way.
- Headline: **"EVERY FINISH LINE STARTS WITH *ONE DECISION*."** — `.hero-title`,
  accent phrase per the italic/gold rule above.
- CTA ("Browse races ↓"): `.button-primary` (gold, dark text, arrow badge).
- **Upcoming-events accordion card** (GoMiles' "UPCOMING EVENT." card),
  floating right on desktop:
  - Shows the first 2 events from the already-fetched `events` list — no new
    data fetching.
  - **Accordion, not two stacked cards**: event 1 expanded (title,
    `.divider-dashed`, then type/date/location meta row + circular arrow
    button linking to `/events/[id]`); event 2 collapsed to a single pill row
    (title + arrow). Clicking a collapsed row expands it and collapses the
    other. Pure client-side toggle, no state persistence.
  - Small "UPCOMING EVENT." eyebrow label above the card, white, uppercase.
  - **Rendered on `lg:` and up only.** *(Change from v1: the mobile stacking
    fallback duplicated events 1–2 immediately above a 4-event grid — the
    same content twice within two screens. On mobile the card is simply
    omitted; the grid is one scroll away.)*
  - Card must not overlap the header or the CTA at intermediate widths —
    check `lg`–`xl` range specifically.

## "Why RunZW" section (new)

Card row between hero and filter bar. Four cards, each with a circular number
badge (01–04), bold uppercase title, one-line description. **Backgrounds
alternate** to echo GoMiles' white/photo rhythm without a photo library:

| # | Background            | Badge            | Title                  | Copy |
|---|-----------------------|------------------|------------------------|------|
| 1 | white                 | near-black       | ONE-TAP REGISTRATION   | No password needed. Register for a race in seconds. |
| 2 | `--green-dark`, white text | white       | EVERY RACE, ONE PLACE  | Road, trail, ultra, relay, and charity runs across Zimbabwe, all in one calendar. |
| 3 | white                 | near-black       | TRUSTED ORGANISERS     | Events listed by registered clubs and organisers — not anonymous posts. |
| 4 | `--gold`, dark text   | near-black       | REAL RACE-DAY DETAILS  | Logistics, countdowns, and finisher info for every event. |

*(Change from v1: "Verified Clubs" copy replaced — the platform already
accepts organisers that aren't clubs, and the roadmap widens this further.
"Trusted Organisers" is true now and stays true. Card 2's copy is knowingly
phase-1 wording; it gets rewritten when service providers launch.)*

Layout: 4-column grid on desktop → 2-col on `md` → 1-col on mobile.

## Filters (`EventFilters.tsx`)

No field/structure changes. Visual only: `.field` radius, **gold focus ring**
(replacing teal), submit button becomes `.button-primary`.

## Event card (`EventCard.tsx`)

No structural/data changes. Visual only:

- Corner radius bumped to the new card standard
- Top accent bar: `green → gold → red` gradient (near-black card borders and
  white surface complete the flag palette deliberately)
- Badges: location/event-type badges green-tinted; countdown badge
  gold-tinted **with dark text**; "closes soon" stays red/urgent
- `.divider-dashed` between the title/club line and the date/meta details
- "View details" link in `--green-dark`; arrow gets the circular-badge hover
  treatment
- **Reserve a badge slot** in the meta row where a future registered-count /
  capacity pill ("124/500") will live — the existing "~N runners expected"
  text renders in that slot for now, styled as a neutral pill

## Footer (`AppFooter.tsx`, new)

*(Scope change from v1, which had no footer.)* Minimal dark credibility band,
not the full GoMiles sitemap footer:

- Near-black background, off-white text
- Row 1: logo mark (green badge) + wordmark, one-line tagline
  ("Zimbabwe's race calendar.")
- Row 2: contact email link · © 2026 RunZW
- No newsletter form, no link columns, no socials in this pass — those arrive
  with phase-2 content

Rendered in `layout.tsx` so it appears app-wide (it's a shared credibility
element, same rationale as the header).

## Global remnant sweep

Teal must not survive anywhere user-visible:

- `theme-color` meta in `layout.tsx`: `#087f7b` → `#1e8e3e`
- Favicon / logo SVG fills
- Any global `:focus-visible` ring color → gold
- Text-selection color if customized

## Responsive notes

All sections follow the existing mobile-first breakpoints (`sm:` `md:` `lg:`
`xl:`). The hero accordion card is `lg:`-only (see Hero). The "Why RunZW"
grid is 4/2/1 columns. Footer stacks its two rows on mobile.

## Testing / verification plan

Pure visual/frontend change plus one small interactive element (hero
accordion toggle); no business logic touched.

1. `npm run lint` and the existing `npm run test` suite pass unchanged.
2. **Contrast is verified against the table in Design Tokens** — every
   gold surface has dark text; every white-text surface is `--green-dark`,
   near-black, or `--red`; no white-on-`--green` normal text anywhere.
3. Manual browser check at mobile/tablet/desktop widths: header, hero (incl.
   accordion expand/collapse, absence on mobile, no overlap at `lg`–`xl`),
   "Why RunZW", filters, event grid/cards, empty state ("No events yet"),
   footer.
4. If Geist italic is unavailable, confirm no synthetic italic renders in the
   hero (inspect computed `font-style`).
5. Spot-check shared components (`AppHeader`, `AppFooter`, `EventCard`,
   buttons, `.field`) on `/events/[id]` and `/clubs` — they inherit the new
   tokens; confirm nothing looks broken even though those pages aren't
   redesigned yet. Confirm `.section-title` headings on those pages are
   **unchanged in size**.

## Parked for later passes (explicitly not this one)

- Social-proof band (member/finisher counts) — needs real numbers
- Testimonials ("From the community") and FAQ sections
- Photo strip / pacers section — needs a photo library
- Real capacity counts on event cards (slot is reserved)
- Nav items beyond Events (Services, Leaderboards) — slots are reserved
- Naming review: "RunZW" semantically excludes cycling/multisport if the
  GoMiles-style full scope is ever pursued; decide before investing in
  expensive branding assets, not now