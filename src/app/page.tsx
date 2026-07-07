import Image from "next/image"
import { EventCard } from "@/components/EventCard"
import { EventFilters } from "@/components/EventFilters"
import { listPublishedDistanceOptions, listPublishedEvents } from "@/lib/events"

export const dynamic = "force-dynamic"

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
      from: sp.from ? new Date(sp.from) : undefined,
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
        <div className="absolute bottom-0 left-0 px-5 pb-8 sm:px-8 sm:pb-10">
          <p className="mb-3 inline-flex rounded-full bg-[rgba(242,184,75,0.9)] px-3 py-1 text-xs font-bold uppercase text-[color:var(--foreground)]">
            Zimbabwe Race Calendar
          </p>
          <h1 className="section-title max-w-2xl font-black text-white">
            Every finish line starts with one decision.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
            Discover running events across Zimbabwe. Register in seconds, no
            password needed.
          </p>
          <a href="#races" className="button-primary mt-6 inline-flex">
            Browse races ↓
          </a>
        </div>
      </section>

      {/* Filters */}
      <section className="mt-5 rounded-[1.5rem] border border-[rgba(24,32,29,0.1)] bg-[rgba(255,255,255,0.58)] p-3 shadow-sm sm:p-4">
        <p className="field-label mb-3">Filter races</p>
        <EventFilters distances={distances} />
      </section>

      {/* Event grid */}
      <div id="races" className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.length === 0 && (
          <p className="rounded-2xl border border-dashed border-[color:var(--line)] bg-white/70 p-5 text-sm text-[color:var(--muted)] md:col-span-2 xl:col-span-3">
            No events yet. Check back soon.
          </p>
        )}
        {events.map((e) => (
          <EventCard key={e.id} e={e} />
        ))}
      </div>
    </main>
  )
}
