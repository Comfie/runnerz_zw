# About / Contact / Privacy / Terms pages + footer upgrade

## Context

Following the homepage redesign ([2026-07-16-homepage-redesign-design.md](./2026-07-16-homepage-redesign-design.md)), the footer built then was deliberately minimal — a single row with logo, tagline, email, and copyright — with link columns explicitly parked for "phase 2 once real content exists." This spec is that phase 2: four new content pages (About, Contact, Privacy Policy, Terms of Use) and the footer upgrade to link to them.

## Scope

New:
- `src/app/about/page.tsx`
- `src/app/contact/page.tsx`
- `src/app/contact/actions.ts`
- `src/app/privacy/page.tsx`
- `src/app/terms/page.tsx`
- `src/components/PageHeader.tsx` — shared eyebrow/title/intro header used by all four pages
- `buildContactMessageEmail()` in `src/lib/email.ts`
- `sendContactMessage()` in `src/lib/send.ts`

Changed:
- `src/components/AppFooter.tsx` — column layout, real contact email
- Anywhere else the placeholder `hello@runzw.com` appears — replaced with the real address

**Out of scope:** social links (no accounts to link to yet), CAPTCHA/spam protection on the contact form (add later if it becomes a problem), any change to the homepage or other existing pages beyond the footer.

## Contact details

Public email and contact-form recipient: **comfynyatsine@gmail.com** (replaces the placeholder `hello@runzw.com` I'd invented in the previous pass). No phone or physical address published at this stage.

## Contact form

`src/app/contact/page.tsx`: name / email / message fields, submit via `<form action={submitContact}>` (mirrors the existing `organiser/apply` pattern). On `?sent=true` in the URL, the page shows a success message ("Thanks — your message has been sent...") instead of the form.

`src/app/contact/actions.ts` (`"use server"`):
- Validates all three fields are non-empty (trimmed) and the email matches a basic email pattern. Client-side `required` on the inputs catches the common case first; if the server check still fails (e.g. JS-disabled or a bad email format), it redirects to `/contact?error=true` and the page shows a small inline error message above the form instead of the success message.
- On success, calls `sendContactMessage({ name, email, message })` and redirects to `/contact?sent=true`.

`sendContactMessage()` in `send.ts` (new, alongside `sendOtp`/`sendClubApprovedEmail`): builds the email via `buildContactMessageEmail()` in `email.ts` (same `buildXEmail` → `sendXEmail` split already used for the club-approval email) and sends it via the existing Resend client, `to: "comfynyatsine@gmail.com"`, with `replyTo` set to the submitter's email so replying goes straight to them.

## PageHeader component

`src/components/PageHeader.tsx`: takes `eyebrow`, `title`, `intro` props, renders the same gold eyebrow pill + bold heading + muted intro paragraph pattern already used informally on the homepage hero — sized for a plain content page (not the huge all-caps `.hero-title`; a smaller `text-3xl sm:text-4xl font-black` heading). Used at the top of About, Contact, Privacy, and Terms.

## Page content outlines

Full prose is written during implementation; structure below.

**About** (`/about`): what RunZW is (Zimbabwe race-listing/discovery platform), how registration works (OTP sign-in, no password, runners pay organisers directly — RunZW doesn't process payments), who it's for (runners + clubs/organisers), framed honestly as an early-stage independent project.

**Contact** (`/contact`): intro line, the form, and a static fallback line with the direct email link.

**Privacy Policy** (`/privacy`): overview; information collected (OTP contact info, registration details, club/organiser application data, contact-form submissions); how it's used; third-party processors named explicitly (Resend for email, Twilio for SMS, Railway for hosting/database); session cookie (NextAuth) disclosure — no ad/tracking cookies; no payment data collected; deletion requests via the contact email; changes to this policy.

**Terms of Use** (`/terms`): acceptance; what RunZW is/isn't (a listing platform, not the event organiser); event info accuracy disclaimer (details come from organisers, unverified, confirm before paying/travelling); no payment processing, registration through RunZW doesn't guarantee the organiser has confirmed your spot; account/sign-in conduct; organiser/club responsibilities; acceptable use; limitation of liability; changes to terms; contact.

*(Not a substitute for legal review — flagged to the user directly, not stated on the public page.)*

## Footer (`AppFooter.tsx`)

Restructure from the current single row into:
- Left: brand mark (green badge) + "RunZW" + tagline (unchanged)
- "Company" column: About, Contact
- "Legal" column: Privacy, Terms
- Bottom row (unchanged pattern): email link (now `comfynyatsine@gmail.com`) + copyright

Stacks to a single column on mobile, consistent with existing responsive conventions.

## Testing / verification plan

1. `npm run lint`, `npx tsc --noEmit`, and `npm run test` pass (test suite unaffected — no existing tests cover these routes).
2. Manual browser check: all four pages render at mobile/desktop widths; footer links navigate correctly; contact form — submit with valid data confirms redirect to `?sent=true` and success message; submit with empty/invalid fields is rejected before sending.
3. Since `RESEND_API_KEY` may not be configured in the local dev environment, confirm the send call is reached (or fails gracefully with a clear error) rather than silently no-op-ing — don't claim the email delivery itself was verified unless it demonstrably was.
