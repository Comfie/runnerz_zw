import { db } from "@/lib/db";

export async function registerForEvent(
  userId: string,
  eventId: string,
  distance: string,
) {
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event || event.status !== "PUBLISHED") {
    throw new Error("event not available");
  }
  if (!event.distanceOptions.includes(distance)) {
    throw new Error("invalid distance");
  }

  return db.registration.upsert({
    where: { userId_eventId: { userId, eventId } },
    update: { distance },
    create: { userId, eventId, distance },
  });
}
