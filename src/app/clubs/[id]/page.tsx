import Image from "next/image"
import { notFound } from "next/navigation"
import { getPublicClub } from "@/lib/clubs"
import { EventCard } from "@/components/EventCard"

export const dynamic = "force-dynamic"

export default async function ClubPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getPublicClub(id)
  if (!result) notFound()
  const { club, upcomingEvents, pastEventCount } = result

  return (
    <main className="app-container py-5 sm:py-8">
      <section className="surface rounded-[1.5rem] p-5 sm:p-7">
        <div className="flex items-center gap-4">
          {club.logoUrl && /^https?:\/\/|^\//.test(club.logoUrl) ? (
            <Image
              src={club.logoUrl}
              width={64}
              height={64}
              alt={club.name}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--teal-dark)] text-2xl font-black text-white">
              {club.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-black">
              {club.name}
              <span className="rounded-full bg-[rgba(8,127,123,0.1)] px-2 py-0.5 text-xs font-bold text-[color:var(--teal-dark)]">
                ✓ Verified
              </span>
            </h1>
            <p className="text-sm text-[color:var(--muted)]">{club.contact}</p>
            {pastEventCount > 0 && (
              <p className="mt-1 text-xs text-[color:var(--muted)]">
                {pastEventCount} past {pastEventCount === 1 ? "event" : "events"}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-black">Upcoming events</h2>
        {upcomingEvents.length === 0 ? (
          <p className="mt-3 text-sm text-[color:var(--muted)]">
            No upcoming events yet.
          </p>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((e) => (
              <EventCard key={e.id} e={e} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
