import { db } from "@/lib/db"
import { EventType } from "@prisma/client"
import type { Prisma } from "@prisma/client"

export type EventFilter = {
  from?: Date
  to?: Date
  location?: string
  distance?: string
  eventType?: string
}

export function buildWhere(f: EventFilter): Prisma.EventWhereInput {
  const where: Prisma.EventWhereInput = { status: "PUBLISHED" }

  if (f.distance) where.distanceOptions = { has: f.distance }
  if (f.location) {
    where.locationText = { contains: f.location, mode: "insensitive" }
  }
  if (f.from || f.to) {
    where.startsAt = {
      ...(f.from && { gte: f.from }),
      ...(f.to && { lte: f.to }),
    }
  }
  if (f.eventType && f.eventType in EventType) {
    where.eventType = f.eventType as EventType
  }

  return where
}

export function listPublishedEvents(f: EventFilter) {
  return db.event.findMany({
    where: buildWhere(f),
    orderBy: { startsAt: "asc" },
    include: { club: true },
  })
}

export function buildDistanceOptions(
  events: { distanceOptions: string[] }[],
): string[] {
  return Array.from(
    new Set(events.flatMap((event) => event.distanceOptions)),
  ).sort((a, b) => {
    const aNumber = Number.parseFloat(a)
    const bNumber = Number.parseFloat(b)
    if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) {
      return aNumber - bNumber
    }
    return a.localeCompare(b)
  })
}

export async function listPublishedDistanceOptions() {
  const events = await db.event.findMany({
    where: { status: "PUBLISHED" },
    select: { distanceOptions: true },
  })
  return buildDistanceOptions(events)
}

export function getEvent(id: string) {
  return db.event.findUnique({ where: { id }, include: { club: true } })
}
