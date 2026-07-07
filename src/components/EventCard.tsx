import Link from "next/link"
import { getCountdownLabel } from "@/lib/countdown"
import type { EventType } from "@prisma/client"

const EVENT_TYPE_LABEL: Record<string, string> = {
  ROAD: "Road",
  TRAIL: "Trail",
  ULTRA: "Ultra",
  RELAY: "Relay",
  CHARITY: "Charity",
  KIDS: "Kids",
}

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
    eventType: EventType | null
    registrationDeadline: Date | null
    expectedRunners: number | null
    hasFinisherMedal: boolean
  }
}) {
  const date = e.startsAt
  const now = new Date()
  const isPast = e.startsAt < now
  const isRegistrationClosed =
    isPast || (e.registrationDeadline !== null && e.registrationDeadline < now)
  const countdown = getCountdownLabel(date)
  const deadlineCountdown = e.registrationDeadline
    ? getCountdownLabel(e.registrationDeadline)
    : null

  return (
    <Link
      href={`/events/${e.id}`}
      className="group relative flex min-h-64 flex-col overflow-hidden rounded-[1.35rem] border border-[rgba(24,32,29,0.1)] bg-[color:var(--surface-strong)] p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]"
    >
      <div className="absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,var(--teal),var(--mango),var(--coral))]" />

      <div className="flex items-start justify-between gap-3 pt-2">
        {/* Date block */}
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

        {/* Top-right badges */}
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full bg-[rgba(8,127,123,0.1)] px-3 py-1 text-xs font-bold text-[color:var(--teal-dark)]">
            {e.locationText}
          </span>
          {e.eventType && (
            <span className="rounded-full bg-[rgba(8,127,123,0.1)] px-3 py-1 text-xs font-bold text-[color:var(--teal-dark)]">
              {EVENT_TYPE_LABEL[e.eventType] ?? e.eventType}
            </span>
          )}
          {!isRegistrationClosed && deadlineCountdown && (
            <span className="rounded-full bg-[rgba(220,38,38,0.12)] px-3 py-1 text-xs font-bold text-red-700">
              Closes {deadlineCountdown.toLowerCase()}
            </span>
          )}
          {e.registrationDeadline && !isPast && isRegistrationClosed && (
            <span className="text-xs text-[color:var(--muted)]">
              Registration closed
            </span>
          )}
          {!isRegistrationClosed && countdown && (
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
      {e.expectedRunners !== null && (
        <p className="mt-1 text-xs text-[color:var(--muted)]">
          ~{e.expectedRunners.toLocaleString()} runners expected
        </p>
      )}
      {e.hasFinisherMedal && (
        <p className="mt-1 text-xs text-[color:var(--muted)]">★ Finisher medal</p>
      )}

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
