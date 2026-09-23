import Image from "next/image"
import Link from "next/link"
import { EventCard } from "@/components/EventCard"
import { EventFilters } from "@/components/EventFilters"
import { NextRaceBib } from "@/components/NextRaceBib"
import { listPublishedDistanceOptions, listPublishedEvents } from "@/lib/events"
import { fmtDate, parseLocalDateTime } from "@/lib/format"

export const dynamic = "force-dynamic"

type SearchParams = {
  location?: string
  distance?: string
  from?: string
  eventType?: string
}

const TYPE_CHIPS = [
  { value: "", label: "All races" },
  { value: "ROAD", label: "Road" },
  { value: "TRAIL", label: "Trail" },
  { value: "ULTRA", label: "Ultra" },
  { value: "RELAY", label: "Relay" },
  { value: "CHARITY", label: "Charity" },
  { value: "KIDS", label: "Kids" },
]

const HOW_IT_WORKS = [
  {
    title: "Pick a race",
    copy: "Browse road, trail, ultra and charity runs by type, town, date or distance.",
  },
  {
    title: "Enter in a minute",
    copy: "Sign in with a one-time code sent to your phone or email. No password to remember.",
  },
  {
    title: "Pay the organiser",
    copy: "Each race page shows how that organiser takes payment, and who to contact.",
  },
  {
    title: "Toe the line",
    copy: "Your races, countdowns and race-day details live in My runs.",
  },
]

function withParam(sp: SearchParams, key: keyof SearchParams, value: string) {
  const params = new URLSearchParams(
    Object.entries(sp).filter((entry): entry is [string, string] => Boolean(entry[1])),
  )
  if (value) params.set(key, value)
  else params.delete(key)
  const qs = params.toString()
  return qs ? `/?${qs}#races` : "/#races"
}

function groupByMonth<T extends { startsAt: Date }>(events: T[]) {
  const groups = new Map<string, T[]>()
  for (const e of events) {
    const key = fmtDate(e.startsAt, { month: "long", year: "numeric" })
    groups.set(key, [...(groups.get(key) ?? []), e])
  }
  return [...groups.entries()]
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const now = new Date()
  const hasFilters = Boolean(sp.location || sp.distance || sp.from || sp.eventType)

  const [upcoming, filtered, distances] = await Promise.all([
    listPublishedEvents({ from: now }),
    hasFilters
      ? listPublishedEvents({
          location: sp.location,
          distance: sp.distance,
          from: (sp.from && parseLocalDateTime(`${sp.from}T00:00`)) || now,
          eventType: sp.eventType,
        })
      : null,
    listPublishedDistanceOptions(),
  ])
  const events = filtered ?? upcoming
  const towns = new Set(upcoming.map((e) => e.locationText.split(",")[0].trim().toLowerCase()))

  const next = upcoming[0]
  const nextRace = next && {
    id: next.id,
    title: next.title,
    startsAtMs: next.startsAt.getTime(),
    dateLabel: fmtDate(next.startsAt, { weekday: "short", day: "numeric", month: "short" }),
    locationText: next.locationText,
    distanceOptions: next.distanceOptions,
    registrationOpen: !next.registrationDeadline || next.registrationDeadline > now,
  }

  return (
    <main>
      <section className="relative isolate overflow-hidden bg-[color:var(--maroon)]">
        <Image
          src="/hero-runners.jpg"
          alt=""
          fill
          sizes="100vw"
          className="hero-photo -z-20 object-cover object-[55%_30%]"
          priority
        />
        <div className="hero-tint absolute inset-0 -z-10" />
        <div className="speed-lines absolute inset-y-0 left-0 -z-10 w-full opacity-40" />

        <div className="app-container grid min-h-[calc(100svh-4rem)] items-end gap-10 pb-12 pt-10 sm:pb-16 lg:grid-cols-[1fr_auto] lg:gap-16">
          <div className="max-w-3xl">
            <p className="mb-6 inline-flex items-center gap-2 font-mono text-sm text-[color:var(--cream)]/80">
              <span className="size-2 rounded-full bg-[color:var(--flag-yellow)] motion-safe:animate-pulse" />
              {upcoming.length > 0
                ? `${upcoming.length} upcoming ${upcoming.length === 1 ? "race" : "races"} in ${towns.size} ${towns.size === 1 ? "town" : "towns"} across Zimbabwe`
                : "Zimbabwe's race calendar"}
            </p>
            <h1 className="hero-display">
              Find your race.
              <br />
              Chase the line.
              <br />
              Run <span className="font-marker">Zimbabwe.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-[color:var(--cream)]/75">
              Every road, trail and ultra race in the country, in one calendar. Enter in
              a minute with a code to your phone.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#races" className="button-flag">
                Browse races
              </a>
              <Link
                href="/organiser/apply"
                className="inline-flex min-h-12 items-center rounded-full border border-[color:var(--cream)]/30 px-5 font-bold text-[color:var(--cream)] transition hover:bg-white/10"
              >
                List your race
              </Link>
            </div>
          </div>

          {nextRace ? (
            <NextRaceBib race={nextRace} serverNow={now.getTime()} />
          ) : (
            <div className="race-bib w-full max-w-sm p-7">
              <p className="text-2xl font-black leading-tight">New races are on the way.</p>
              <p className="mt-2 text-sm">Organising one? Put it in front of Zimbabwe&rsquo;s runners.</p>
              <Link href="/organiser/apply" className="button-flag mt-5 w-full">
                List your race
              </Link>
            </div>
          )}
        </div>
      </section>

      <div className="app-container pb-10">
      <section id="races" className="scroll-mt-20 pt-12 sm:pt-16">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="section-title font-black">Upcoming races</h2>
          {hasFilters && (
            <Link href="/#races" className="text-sm font-bold text-[color:var(--green-dark)] hover:underline">
              Clear filters
            </Link>
          )}
        </div>

        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {TYPE_CHIPS.map((chip) => {
            const active = (sp.eventType ?? "") === chip.value
            return (
              <Link
                key={chip.label}
                href={withParam(sp, "eventType", chip.value)}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition ${
                  active
                    ? "border-[color:var(--maroon)] bg-[color:var(--maroon)] text-[color:var(--cream)]"
                    : "border-[color:var(--line)] bg-white text-[color:var(--foreground)] hover:border-[color:var(--blood)]"
                }`}
              >
                {chip.label}
              </Link>
            )
          })}
        </div>

        <details
          className="group mt-3 rounded-[1.5rem] border border-[rgba(20,23,26,0.1)] bg-[rgba(255,255,255,0.58)] p-3 shadow-sm sm:p-4"
          open={Boolean(sp.location || sp.distance || sp.from)}
        >
          <summary className="cursor-pointer list-none text-sm font-bold text-[color:var(--muted)]">
            <span className="group-open:hidden">+ More filters (location, date, distance)</span>
            <span className="hidden group-open:inline">− Hide filters</span>
          </summary>
          <div className="mt-3">
            <EventFilters distances={distances} values={sp} />
          </div>
        </details>

        {events.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-[color:var(--line)] bg-white/70 p-8 text-center">
            <p className="font-bold">No upcoming races match your filters.</p>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              Try another location or distance — or check back soon as organisers add new events.
            </p>
            <Link href="/#races" className="button-secondary mt-4 inline-flex">
              Show all races
            </Link>
          </div>
        ) : (
          groupByMonth(events).map(([month, monthEvents]) => (
            <div key={month} className="mt-8">
              <h3 className="mb-3 flex items-center gap-3 text-sm font-black uppercase tracking-wide text-[color:var(--muted)]">
                {month}
                <span className="h-px flex-1 bg-[color:var(--line)]" />
                <span className="text-xs font-bold normal-case">
                  {monthEvents.length} {monthEvents.length === 1 ? "race" : "races"}
                </span>
              </h3>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {monthEvents.map((e) => (
                  <EventCard key={e.id} e={e} />
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      <section className="mt-16">
        <h2 className="section-title font-black">How it works</h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step.title} className="border-t-4 border-[color:var(--blood)] pt-4">
              <span className="bib-number text-4xl text-[color:var(--blood)]">{i + 1}</span>
              <h3 className="mt-2 text-lg font-black">{step.title}</h3>
              <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">{step.copy}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="relative mt-16 overflow-hidden rounded-[1.75rem] bg-[color:var(--maroon)] p-6 text-[color:var(--cream)] sm:p-10">
        <div className="absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,var(--green),var(--gold),var(--red))]" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <p className="text-sm font-bold text-[color:var(--flag-yellow)]">
              For clubs and race organisers
            </p>
            <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">
              Put your race in front of Zimbabwe&rsquo;s runners.
            </h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--cream)]/70">
              List your event, take registrations with runner and emergency details, and
              export your entrant list in one click.
            </p>
          </div>
          <Link href="/organiser/apply" className="button-flag shrink-0">
            List your race
          </Link>
        </div>
      </section>
      </div>
    </main>
  )
}
