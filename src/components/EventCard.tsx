import Link from "next/link"
import { getCountdownLabel } from "@/lib/countdown"

export function EventCard({
  e,
}: {
  e: {
    id: string
    title: string
    startsAt: Date
    locationText: string
    distanceOptions: string[]
    club: { name: string }
  }
}) {
  const date = e.startsAt
  const countdown = getCountdownLabel(date)

  return (
    <Link
      href={`/events/${e.id}`}
      className="group relative flex min-h-64 flex-col overflow-hidden rounded-[1.35rem] border border-[rgba(24,32,29,0.1)] bg-[color:var(--surface-strong)] p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]"
    >
      <div className="absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,var(--teal),var(--mango),var(--coral))]" />

      <div className="flex items-start justify-between gap-3 pt-2">
        {/* Date block: day / month / number */}
        <div className="rounded-2xl bg-[color:var(--foreground)] px-3 py-2 text-center text-white">
          <span className="block text-[0.6rem] font-bold uppercase leading-none text-white/65">
            {date.toLocaleString("en", { weekday: "short" })}
          </span>
          <span className="block text-xs font-bold uppercase text-white/65">
            {date.toLocaleString("en", { month: "short" })}
          </span>
          <span className="block text-2xl font-black leading-none">
            {date.getDate()}
          </span>
        </div>

        {/* Location + countdown stacked top-right */}
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full bg-[rgba(8,127,123,0.1)] px-3 py-1 text-xs font-bold text-[color:var(--teal-dark)]">
            {e.locationText}
          </span>
          {countdown && (
            <span className="rounded-full bg-[rgba(242,184,75,0.18)] px-3 py-1 text-xs font-bold text-[color:var(--teal-dark)]">
              {countdown}
            </span>
          )}
        </div>
      </div>

      <h3 className="mt-5 text-xl font-black leading-tight tracking-normal">
        {e.title}
      </h3>
      <p className="mt-1 text-xs text-[color:var(--muted)]">by {e.club.name}</p>
      <p className="mt-2 text-sm text-[color:var(--muted)]">
        {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </p>

      <div className="mt-auto flex flex-wrap gap-2 pt-6">
        {e.distanceOptions.map((distance) => (
          <span
            key={distance}
            className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs font-bold"
          >
            {distance}
          </span>
        ))}
      </div>

      <span className="mt-5 inline-flex items-center text-sm font-bold text-[color:var(--teal-dark)]">
        View details
        <span className="ml-2 transition group-hover:translate-x-1">→</span>
      </span>
    </Link>
  )
}
