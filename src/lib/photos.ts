import { db } from "@/lib/db"

export const MAX_PHOTOS_PER_EVENT = 12
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_BYTES = 5 * 1024 * 1024

export function validateImageFile(file: {
  type: string
  size: number
}): string | null {
  if (!ALLOWED_TYPES.includes(file.type))
    return "Only JPEG, PNG or WebP images are allowed"
  if (file.size > MAX_BYTES) return "Images must be 5 MB or smaller"
  return null
}

export async function assertCanAddPhotos(
  eventId: string,
  clubId: string,
  count: number,
) {
  const event = await db.event.findUnique({
    where: { id: eventId },
    include: { _count: { select: { photos: true } } },
  })
  if (!event || event.clubId !== clubId) throw new Error("not your event")
  if (event._count.photos + count > MAX_PHOTOS_PER_EVENT)
    throw new Error("photo limit reached")
}

export function createEventPhotos(eventId: string, urls: string[]) {
  return db.eventPhoto.createMany({
    data: urls.map((url) => ({ eventId, url })),
  })
}

async function requireOwnedPhoto(photoId: string, clubId: string) {
  const photo = await db.eventPhoto.findUnique({
    where: { id: photoId },
    include: { event: true },
  })
  if (!photo || photo.event.clubId !== clubId)
    throw new Error("not your photo")
  return photo
}

export async function deleteEventPhoto(photoId: string, clubId: string) {
  const photo = await requireOwnedPhoto(photoId, clubId)
  await db.eventPhoto.delete({ where: { id: photoId } })
  return photo.url
}

export async function updateEventPhotoCaption(
  photoId: string,
  clubId: string,
  caption: string,
) {
  await requireOwnedPhoto(photoId, clubId)
  return db.eventPhoto.update({
    where: { id: photoId },
    data: { caption: caption.trim() || null },
  })
}

export function listEventPhotos(eventId: string) {
  return db.eventPhoto.findMany({
    where: { eventId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  })
}
