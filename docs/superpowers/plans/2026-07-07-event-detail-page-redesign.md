# Event Detail Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the bare v1 event detail page with an emotionally engaging layout featuring a cover image hero (with gradient fallback), a sticky always-visible register button, and full race info with club attribution.

**Architecture:** Two files change. `next.config.ts` adds `remotePatterns` so `next/image` can load organiser-supplied URLs. `src/app/events/[id]/page.tsx` is fully rewritten — it reuses `getEvent` (which already fetches club data) and the existing `getCountdownLabel` utility. No schema changes, no new lib files.

**Tech Stack:** Next.js App Router (TypeScript) · `next/image` · Tailwind CSS · `src/lib/countdown.ts` (already exists)

**Commit policy:** Confirm with user before every `git commit`. No `Co-authored-by` lines.

---

## File Structure

```
next.config.ts                          ← add images.remotePatterns
src/app/events/[id]/page.tsx            ← full rewrite
```

---

### Task 1: Allow external images in Next.js config

**Files:**
- Modify: `next.config.ts`

The `next/image` component rejects external `src` URLs unless the hostname is explicitly whitelisted. Organisers paste arbitrary image URLs in v1, so a permissive wildcard is used. This must be done before the page rewrite so the build doesn't fail on the `<Image>` call.

- [ ] **Step 1: Update `next.config.ts`**

Replace the entire file contents:

```ts
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 2: Verify the config is valid**

```bash
cd /Users/comfort/Projects/personal/parkrun-zw && npm run build 2>&1 | tail -5
```

Expected: build succeeds (same as before — no new errors introduced by the config change alone).

- [ ] **Step 3: Commit checkpoint** (confirm with user first)

```bash
git add next.config.ts
git commit -m "chore: allow external image hostnames for organiser cover images"
```

---

### Task 2: Redesign the event detail page

**Files:**
- Modify: `src/app/events/[id]/page.tsx`

This is a full rewrite of the page. Key behaviours:

- Hero: `<Image>` if `coverImageUrl` is set; otherwise a teal-to-dark CSS gradient fills the same container
- Overlay + text anchored bottom-left: location badge, countdown chip (hidden if past or null), title, club name
- Two-column layout below the hero (desktop: main column + sticky sidebar; mobile: single column)
- Past-event check: `isPast = e.startsAt < now` — computed once server-side, used for both the sidebar button and the mobile sticky bar
- Mobile sticky bar: `fixed bottom-0` register button, hidden at `lg`; `pb-24` on `<main>` prevents it covering content

- [ ] **Step 1: Rewrite `src/app/events/[id]/page.tsx`**

```tsx
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getEvent } from "@/lib/events"
import { getCountdownLabel } from "@/lib/countdown"

export const dynamic = "force-dynamic"

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
  const countdown = getCountdownLabel(e.startsAt)

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
            {countdown && (
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

          {e.lat && e.lng && (
            <div className="surface rounded-[1.5rem] p-5 sm:p-6">
              <h2 className="text-lg font-black">Location</h2>
              <p className="mt-2 text-sm text-[color:var(--muted)]">{e.locationText}</p>
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
                <p className="text-sm text-[color:var(--muted)]">{e.club.contact}</p>
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
            {isPast ? (
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
        {isPast ? (
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

- [ ] **Step 2: Verify the build passes**

```bash
cd /Users/comfort/Projects/personal/parkrun-zw && npm run build 2>&1 | tail -10
```

Expected: all 17 routes compile, zero TypeScript errors.

- [ ] **Step 3: Manual verification**

Run `npm run dev` and open an event detail page. Check all 8 conditions from the spec:

1. Event with `coverImageUrl` set → hero shows the photo
2. Event without `coverImageUrl` → hero shows the teal-to-dark gradient
3. Future event → amber countdown chip in hero, Register button active in sidebar and mobile bar
4. Past event (`startsAt` in the past) → no countdown chip, both sidebar and mobile bar show "Registration closed"
5. Event with `lat` and `lng` both set → Location card appears with Google Maps link
6. Event without `lat`/`lng` → Location card absent
7. On mobile (< 1024px): sticky bar pins to bottom; scrolling to the bottom of a long description doesn't show content hidden under the bar (`pb-24` provides clearance)
8. On desktop (≥ 1024px): sidebar stays fixed as main column scrolls; mobile sticky bar is not visible

- [ ] **Step 4: Commit checkpoint** (confirm with user first)

```bash
git add src/app/events/[id]/page.tsx
git commit -m "feat: redesign event detail page with photo hero, sticky register CTA, and club info"
```

---

## Self-Review

**Spec coverage:**
- Hero with cover image → Task 2 (`e.coverImageUrl ? <Image> : gradient div`) ✅
- Gradient fallback → Task 2 (`bg-[linear-gradient(135deg,...)]`) ✅
- Overlay → Task 2 (`absolute inset-0 bg-gradient-to-b ...`) ✅
- Location badge, countdown chip, title, club name in hero → Task 2 ✅
- Gradient bar removed → Task 2 (not present in new file) ✅
- About / payment / location (conditional) / organiser cards → Task 2 ✅
- Sticky sidebar with full date, distances, register button, share line → Task 2 ✅
- `isPast` check controlling register vs "Registration closed" in both locations → Task 2 ✅
- Mobile sticky bar → Task 2 (`fixed bottom-0 ... lg:hidden`) ✅
- `pb-24` on main to clear mobile bar → Task 2 ✅
- `next.config.ts` remotePatterns → Task 1 ✅

**Type consistency:** `getEvent` returns Prisma's `Event & { club: Club }`. Fields accessed — `e.coverImageUrl: string | null`, `e.lat: number | null`, `e.lng: number | null`, `e.startsAt: Date`, `e.club.name: string`, `e.club.contact: string`, `e.club.logoUrl: string | null` — all match the Prisma schema. `getCountdownLabel` called with `e.startsAt` (a `Date`) — matches its signature.

**No placeholders:** all steps contain complete code and exact commands.
