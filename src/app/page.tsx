import Image from "next/image"
import { EventCard } from "@/components/EventCard"
import { EventFilters } from "@/components/EventFilters"
import { HeroUpcomingCard } from "@/components/HeroUpcomingCard"
import { listPublishedDistanceOptions, listPublishedEvents } from "@/lib/events"
import { parseLocalDateTime } from "@/lib/format"

export const dynamic = "force-dynamic"

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
    copy: "Logistics, countdowns, and finisher info for every event.",
    tone: "gold" as const,
  },
]

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    location?: string
    distance?: string
    from?: string
    eventType?: string
  }>
}) {
  const sp = await searchParams
  const [events, distances] = await Promise.all([
    listPublishedEvents({
      location: sp.location,
      distance: sp.distance,
      from: (sp.from && parseLocalDateTime(`${sp.from}T00:00`)) || new Date(),
      eventType: sp.eventType,
    }),
    listPublishedDistanceOptions(),
  ])

  return (
    <main className="app-container py-5 sm:py-8 lg:py-10">
      {/* Hero */}
      <section className="relative min-h-[65vh] overflow-hidden rounded-[1.75rem]">
        <Image
          src="/vic_falls.jpeg"
          alt="Runners at the Econet Asambeni Legends Relay, Zimbabwe"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/[0.72]" />
        {/* Normal flow (not absolute) so the section grows to fit the headline
            instead of clipping it — min-h-[65vh] on the section is a floor,
            not a fixed box, on viewports where the wrapped headline needs
            more room than the viewport height allows (e.g. wide-but-short
            laptop screens). */}
        <div className="relative flex min-h-[65vh] flex-col justify-end gap-6 px-5 pb-8 sm:px-8 sm:pb-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 inline-flex rounded-full bg-[color:var(--gold)] px-3 py-1 text-xs font-bold uppercase text-[color:var(--foreground)]">
              Zimbabwe Race Calendar
            </p>
            {/* Geist has no italic style (checked font-data.json — "normal" only),
                so the accent phrase is picked out in gold instead of italicised. */}
            <h1 className="hero-title text-white">
              Every finish line starts with <em>one decision</em>.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
              Discover running events across Zimbabwe. Register in seconds, no
              password needed.
            </p>
            <a href="#races" className="button-primary mt-6 inline-flex">
              Browse races
              <span className="icon-badge icon-badge-dark">↓</span>
            </a>
          </div>
          <HeroUpcomingCard events={events.slice(0, 2)} />
        </div>
      </section>

      {/* Why RunZW */}
      <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <h3 className="mt-4 text-base font-black uppercase leading-tight">
              {item.title}
            </h3>
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

      {/* Filters */}
      <section className="mt-5 rounded-[1.5rem] border border-[rgba(20,23,26,0.1)] bg-[rgba(255,255,255,0.58)] p-3 shadow-sm sm:p-4">
        <p className="field-label mb-3">Filter races</p>
        <EventFilters distances={distances} />
      </section>

      {/* Event grid */}
      <div id="races" className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.length === 0 && (
          <p className="rounded-2xl border border-dashed border-[color:var(--line)] bg-white/70 p-5 text-sm text-[color:var(--muted)] md:col-span-2 xl:col-span-3">
            No upcoming races match your filters. Try a different location or distance.
          </p>
        )}
        {events.map((e) => (
          <EventCard key={e.id} e={e} />
        ))}
      </div>
    </main>
  )
}
