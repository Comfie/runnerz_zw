import { EventCard } from "@/components/EventCard";
import { EventFilters } from "@/components/EventFilters";
import { listPublishedDistanceOptions, listPublishedEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    location?: string;
    distance?: string;
    from?: string;
  }>;
}) {
  const sp = await searchParams;
  const [events, distances] = await Promise.all([
    listPublishedEvents({
      location: sp.location,
      distance: sp.distance,
      from: sp.from ? new Date(sp.from) : undefined,
    }),
    listPublishedDistanceOptions(),
  ]);

  return (
    <main className="app-container py-5 sm:py-8 lg:py-10">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(24,32,29,0.1)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-7 lg:p-9">
        <div className="absolute right-[-3rem] top-[-3rem] hidden h-52 w-52 rotate-12 rounded-[2rem] border-[18px] border-[rgba(8,127,123,0.12)] lg:block" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_18rem] lg:items-end">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-[rgba(242,184,75,0.22)] px-3 py-1 text-xs font-bold uppercase text-[color:var(--teal-dark)]">
              Zimbabwe race calendar
            </p>
            <h1 className="section-title max-w-3xl font-black">
              Find your next start line.
            </h1>
            <p className="mt-4 max-w-[42rem] text-base leading-7 text-[color:var(--muted)] sm:text-lg">
              Browse local running events, filter by distance or city, and
              register without creating a password.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[color:var(--foreground)] p-3 text-center text-white sm:max-w-sm lg:max-w-none">
            <div className="rounded-xl bg-white/10 p-3">
              <span className="block text-2xl font-black">{events.length}</span>
              <span className="text-[0.65rem] uppercase text-white/70">
                Events
              </span>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <span className="block text-2xl font-black">{distances.length}</span>
              <span className="text-[0.65rem] uppercase text-white/70">
                Distances
              </span>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <span className="block text-2xl font-black">OTP</span>
              <span className="text-[0.65rem] uppercase text-white/70">
                Sign in
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-[1.5rem] border border-[rgba(24,32,29,0.1)] bg-[rgba(255,255,255,0.58)] p-3 shadow-sm sm:p-4">
        <EventFilters distances={distances} />
      </section>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
  );
}
