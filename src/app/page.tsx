import Image from "next/image"
import Link from "next/link"
import { EventCard } from "@/components/EventCard"
import { EventFilters } from "@/components/EventFilters"
import { HeroUpcomingCard } from "@/components/HeroUpcomingCard"
import { BRAND } from "@/lib/brand"
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

const WHY_RUNZW = [
  {
    number: "01",
    title: "One-tap registration",
    copy: "No password needed. Register for a race in seconds.",
    tone: "light" as const,
  },
  {
    number: "02",
    title: "Every race, one place",
    copy: "Road, trail, ultra, relay, and charity runs across Zimbabwe, all in one calendar.",
    tone: "green" as const,
  },
  {
    number: "03",
    title: "Trusted organisers",
    copy: "Events listed by registered clubs and organisers — not anonymous posts.",
    tone: "light" as const,
  },
  {
    number: "04",
    title: "Real race-day details",
    copy: "Logistics, countdowns, weather and maps for every event.",
    tone: "gold" as const,
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

  return (
    <main className="app-container py-5 sm:py-8 lg:py-10">
      <section className="relative min-h-[60vh] overflow-hidden rounded-[1.75rem]">
        <Image
          src="/vic_falls.jpeg"
          alt="Runners on a race course in Zimbabwe"
          fill
          sizes="(min-width: 1152px) 1152px, 100vw"
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black/[0.78]" />
        <div className="relative flex min-h-[60vh] flex-col justify-end gap-6 px-5 pb-8 sm:px-8 sm:pb-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 inline-flex rounded-full bg-[color:var(--gold)] px-3 py-1 text-xs font-bold uppercase text-[color:var(--foreground)]">
              {BRAND.tagline}
            </p>
            <h1 className="hero-title text-white">
              Every finish line starts with <em>one decision</em>.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
              Discover road, trail and ultra races across Zimbabwe. Register in
              seconds — no password needed.
            </p>
            {upcoming.length > 0 && (
              <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm font-bold text-white">
                <span>
                  <span className="text-[color:var(--gold)]">{upcoming.length}</span> upcoming{" "}
                  {upcoming.length === 1 ? "race" : "races"}
                </span>
                <span>
                  <span className="text-[color:var(--gold)]">{towns.size}</span>{" "}
                  {towns.size === 1 ? "town" : "towns"}
                </span>
              </p>
            )}
            <a href="#races" className="button-primary mt-6 inline-flex">
              Find your next race
              <span className="icon-badge icon-badge-dark">↓</span>
            </a>
          </div>
          <HeroUpcomingCard events={upcoming.slice(0, 3)} />
        </div>
      </section>

      <section id="races" className="scroll-mt-24 pt-8 sm:pt-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="field-label">Race calendar</p>
            <h2 className="section-title font-black">Upcoming races</h2>
          </div>
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
                    ? "border-[color:var(--foreground)] bg-[color:var(--foreground)] text-white"
                    : "border-[color:var(--line)] bg-white text-[color:var(--foreground)] hover:border-[color:var(--green)]"
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

      <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {WHY_RUNZW.map((item) => (
          <div
            key={item.number}
            className={`rounded-[1.5rem] p-5 ${
              item.tone === "green"
                ? "bg-[color:var(--green-dark)] text-white"
                : item.tone === "gold"
                  ? "bg-[color:var(--gold)] text-[color:var(--foreground)]"
                  : "border border-[color:var(--line)] bg-white text-[color:var(--foreground)]"
            }`}
          >
            <span
              className={`grid size-8 place-items-center rounded-full text-xs font-black ${
                item.tone === "green"
                  ? "bg-white text-[color:var(--green-dark)]"
                  : "bg-[color:var(--foreground)] text-white"
              }`}
            >
              {item.number}
            </span>
            <h3 className="mt-4 text-base font-black uppercase leading-tight">{item.title}</h3>
            <p
              className={`mt-2 text-sm leading-6 ${
                item.tone === "light" ? "text-[color:var(--muted)]" : "opacity-85"
              }`}
            >
              {item.copy}
            </p>
          </div>
        ))}
      </section>

      <section className="relative mt-5 overflow-hidden rounded-[1.75rem] bg-[color:var(--foreground)] p-6 text-white sm:p-10">
        <div className="absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,var(--green),var(--gold),var(--red))]" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--gold)]">
              For clubs &amp; race organisers
            </p>
            <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">
              Put your race in front of Zimbabwe&rsquo;s runners.
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/70">
              List your event, take registrations with runner and emergency details, and
              export your entrant list in one click.
            </p>
          </div>
          <Link href="/organiser/apply" className="button-primary shrink-0">
            List your race
            <span className="icon-badge icon-badge-dark">→</span>
          </Link>
        </div>
      </section>
    </main>
  )
}
