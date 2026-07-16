"use client"

import Link from "next/link"
import { useState } from "react"
import type { EventType } from "@prisma/client"

const EVENT_TYPE_LABEL: Record<string, string> = {
  ROAD: "Road",
  TRAIL: "Trail",
  ULTRA: "Ultra",
  RELAY: "Relay",
  CHARITY: "Charity",
  KIDS: "Kids",
}

type UpcomingEvent = {
  id: string
  title: string
  startsAt: Date
  locationText: string
  eventType: EventType | null
}

export function HeroUpcomingCard({ events }: { events: UpcomingEvent[] }) {
  const [expanded, setExpanded] = useState(0)

  if (events.length === 0) return null

  return (
    <div className="hidden lg:block lg:w-80 xl:w-96">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-white/85">
        Upcoming event.
      </p>
      <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-[var(--shadow-soft)]">
        {events.map((event, index) => {
          const isExpanded = index === expanded
          return (
            <div
              key={event.id}
              className={index > 0 ? "divider-dashed" : undefined}
            >
              {isExpanded ? (
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-black leading-tight">
                      {event.title}
                    </h3>
                    <Link
                      href={`/events/${event.id}`}
                      aria-label={`View ${event.title}`}
                      className="icon-badge icon-badge-dark shrink-0"
                    >
                      →
                    </Link>
                  </div>
                  <div className="divider-dashed mt-3 pt-3 text-xs text-[color:var(--muted)]">
                    {event.eventType && (
                      <span className="font-bold">
                        {EVENT_TYPE_LABEL[event.eventType] ?? event.eventType}
                        {" · "}
                      </span>
                    )}
                    {event.startsAt.toLocaleDateString("en", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                    {" · "}
                    {event.locationText}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setExpanded(index)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left"
                >
                  <span className="text-sm font-bold">{event.title}</span>
                  <span className="icon-badge icon-badge-dark shrink-0">→</span>
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
