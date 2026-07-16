import { db } from "@/lib/db"

export async function getPublicClub(id: string) {
  const club = await db.club.findUnique({ where: { id } })
  if (!club || !club.verified) return null
  const now = new Date()
  const [upcomingEvents, pastEventCount] = await Promise.all([
    db.event.findMany({
      where: { clubId: id, status: "PUBLISHED", startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      include: { club: true },
    }),
    db.event.count({
      where: { clubId: id, status: "PUBLISHED", startsAt: { lt: now } },
    }),
  ])
  return { club, upcomingEvents, pastEventCount }
}
