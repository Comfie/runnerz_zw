import Image from "next/image"
import Link from "next/link"
import { getCountdownLabel } from "@/lib/countdown"
import { dateParts, fmtTime } from "@/lib/format"
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
    coverImageUrl: string | null
    club: { name: string }
    eventType: EventType | null
    registrationDeadline: Date | null
    expectedRunners: number | null
    hasFinisherMedal: boolean
  }
}) {
  const parts = dateParts(e.startsAt)
  const now = new Date()
  const isPast = e.startsAt < now
  const isRegistrationClosed =
    isPast || (e.registrationDeadline !== null && e.registrationDeadline < now)
  const countdown = getCountdownLabel(e.startsAt)
  const deadlineCountdown =
    e.registrationDeadline && !isRegistrationClosed
      ? getCountdownLabel(e.registrationDeadline)
      : null
  const closingSoon =
    deadlineCountdown && ["Today!", "Tomorrow", "This week"].includes(deadlineCountdown)
  const hasImage = Boolean(e.coverImageUrl && /^https?:\/\/|^\//.test(e.coverImageUrl))
  const typeLabel = e.eventType ? (EVENT_TYPE_LABEL[e.eventType] ?? e.eventType) : null

  return (
    <Link
      href={`/events/${e.id}`}
      className="group flex flex-col overflow-hidden rounded-[1.5rem] border border-[rgba(20,23,26,0.1)] bg-[color:var(--surface)] shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        {hasImage ? (
          <Image
            src={e.coverImageUrl!}
            alt=""
            fill
            sizes="(min-width: 1280px) 360px, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--green)_0%,var(--green-dark)_45%,var(--foreground)_100%)]">
            <span className="absolute -bottom-3 right-3 text-6xl font-black uppercase text-white/10">
              {typeLabel ?? "Run"}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {typeLabel && (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-[color:var(--green-dark)]">
              {typeLabel}
            </span>
          )}
          {closingSoon && (
            <span className="rounded-full bg-[color:var(--red)] px-2.5 py-1 text-xs font-bold text-white">
              Entries close {deadlineCountdown!.toLowerCase()}
            </span>
          )}
        </div>
        {!isPast && countdown && (
          <span className="absolute right-3 top-3 rounded-full bg-[color:var(--gold)] px-2.5 py-1 text-xs font-bold text-[color:var(--foreground)]">
            {countdown}
          </span>
        )}

        <div className="absolute bottom-3 left-3 rounded-2xl bg-white px-3 py-1.5 text-center shadow-sm">
          <span className="block text-[0.6rem] font-bold uppercase leading-tight text-[color:var(--muted)]">
            {parts.weekday} · {parts.month}
          </span>
          <span className="block text-2xl font-black leading-none">{parts.day}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-black leading-tight">{e.title}</h3>
        <p className="mt-1 text-sm text-[color:var(--muted)]">
          {e.locationText} · {fmtTime(e.startsAt)}
        </p>

        <div className="mb-4 mt-3 flex flex-wrap gap-1.5">
          {e.distanceOptions.map((distance) => (
            <span
              key={distance}
              className="rounded-full border border-[color:var(--line)] px-2.5 py-0.5 text-xs font-bold"
            >
              {distance}
            </span>
          ))}
        </div>

        <div className="divider-dashed mt-auto flex items-center justify-between gap-3 pt-3 text-xs text-[color:var(--muted)]">
          <span className="flex flex-wrap gap-x-3 gap-y-1">
            {e.expectedRunners !== null && (
              <span>~{e.expectedRunners.toLocaleString()} runners</span>
            )}
            {e.hasFinisherMedal && <span>★ Medal</span>}
            {!e.expectedRunners && !e.hasFinisherMedal && <span>by {e.club.name}</span>}
            {isRegistrationClosed && !isPast && (
              <span className="font-bold">Entries closed</span>
            )}
          </span>
          <span className="icon-badge icon-badge-dark">→</span>
        </div>
      </div>
    </Link>
  )
}
