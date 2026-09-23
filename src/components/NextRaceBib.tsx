"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

type NextRace = {
  id: string
  title: string
  startsAtMs: number
  dateLabel: string
  locationText: string
  distanceOptions: string[]
  registrationOpen: boolean
}

function split(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}

const pad = (n: number) => String(n).padStart(2, "0")

export function NextRaceBib({ race, serverNow }: { race: NextRace; serverNow: number }) {
  const [now, setNow] = useState(serverNow)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const left = split(race.startsAtMs - now)
  const cta = race.registrationOpen ? `/register/${race.id}` : `/events/${race.id}`

  return (
    <div className="race-bib w-full max-w-sm p-6 sm:p-7">
      <span className="bib-pin left-3 top-3" />
      <span className="bib-pin right-3 top-3" />
      <span className="bib-pin bottom-3 left-3" />
      <span className="bib-pin bottom-3 right-3" />

      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold text-[color:var(--blood)]">Next race</p>
        <p className="text-right text-sm font-bold">{race.dateLabel}</p>
      </div>

      <Link href={`/events/${race.id}`} className="mt-1 block text-2xl font-black leading-tight hover:underline">
        {race.title}
      </Link>
      <p className="text-sm text-[color:var(--blood)]/80">{race.locationText}</p>

      <div className="mt-4 flex items-end gap-3 border-y-2 border-dashed border-[color:var(--maroon)]/20 py-3">
        <span className="bib-number text-7xl leading-none text-[color:var(--blood)]">{left.days}</span>
        <span className="pb-1.5 text-sm font-bold leading-tight">
          {left.days === 1 ? "day" : "days"} to
          <br />
          the start
        </span>
        <span
          className="bib-number ml-auto pb-1.5 text-lg"
          aria-label={`${left.hours} hours, ${left.minutes} minutes`}
        >
          {pad(left.hours)}:{pad(left.minutes)}:{pad(left.seconds)}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {race.distanceOptions.map((d) => (
          <span key={d} className="rounded-full bg-[color:var(--maroon)] px-3 py-1 text-xs font-bold text-[color:var(--cream)]">
            {d}
          </span>
        ))}
      </div>

      <Link href={cta} className="button-flag mt-5 w-full">
        {race.registrationOpen ? "Enter now" : "See race details"}
      </Link>
    </div>
  )
}
