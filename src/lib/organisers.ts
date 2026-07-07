import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import type { EventType } from "@prisma/client"

export async function applyAsOrganiser(
  userId: string,
  clubName: string,
  contact: string,
) {
  const club = await db.club.create({
    data: { name: clubName, contact, ownerId: userId, verified: false },
  })
  await db.user.update({
    where: { id: userId },
    data: { role: "ORGANISER", clubId: club.id },
  })
  return club
}

export async function requireOrganiser(): Promise<{
  userId: string
  clubId: string
}> {
  const { auth } = await import("@/lib/auth")
  const session = await auth()
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) redirect("/signin")

  const club = await db.club.findUnique({ where: { ownerId: userId } })
  if (!club || !club.verified) redirect("/organiser/pending")
  return { userId, clubId: club.id }
}

type EventInput = {
  title: string
  description: string
  startsAt: Date
  locationText: string
  distanceOptions: string[]
  paymentInfo: string
  coverImageUrl?: string | null
  eventType?: EventType | null
  logistics?: string | null
  registrationDeadline?: Date | null
  expectedRunners?: number | null
  hasFinisherMedal?: boolean
}

export async function saveEvent(
  clubId: string,
  data: EventInput,
  id?: string,
) {
  if (id) {
    const existing = await db.event.findUnique({ where: { id } })
    if (!existing || existing.clubId !== clubId) throw new Error("not your event")
    return db.event.update({ where: { id }, data })
  }

  return db.event.create({ data: { ...data, clubId } })
}

export async function setEventStatus(
  eventId: string,
  clubId: string,
  status: "DRAFT" | "PUBLISHED",
) {
  const event = await db.event.findUnique({ where: { id: eventId } })
  if (!event || event.clubId !== clubId) throw new Error("not your event")
  return db.event.update({ where: { id: eventId }, data: { status } })
}
