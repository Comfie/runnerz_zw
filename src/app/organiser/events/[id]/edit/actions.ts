"use server"

import { requireOrganiser, saveEvent } from "@/lib/organisers"
import { redirect } from "next/navigation"
import { EventType } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { del } from "@vercel/blob"
import { uploadEventImage } from "@/lib/blob"
import { parseLatLng } from "@/lib/geo"
import { parseLocalDateTime } from "@/lib/format"
import {
  assertCanAddPhotos,
  createEventPhotos,
  deleteEventPhoto,
  updateEventPhotoCaption,
  validateImageFile,
} from "@/lib/photos"

export async function updateEvent(id: string, formData: FormData) {
  const { clubId } = await requireOrganiser()
  const eventType = String(formData.get("eventType") ?? "")
  const startsAtRaw = parseLocalDateTime(String(formData.get("startsAt") ?? ""))
  if (!startsAtRaw) throw new Error("invalid startsAt")
  const rawRunners = parseInt(String(formData.get("expectedRunners") ?? ""), 10)
  const coverFile = formData.get("coverImage")
  let coverImageUrl = String(formData.get("coverImageUrl") ?? "") || null
  if (coverFile instanceof File && coverFile.size > 0) {
    const fileError = validateImageFile(coverFile)
    if (fileError) throw new Error(fileError)
    coverImageUrl = await uploadEventImage("events/covers", coverFile)
  }
  const locationPin = String(formData.get("locationPin") ?? "").trim()
  const coords = locationPin ? parseLatLng(locationPin) : null
  if (locationPin && !coords)
    throw new Error(
      "Could not read coordinates — paste a full Google Maps link or 'lat, lng'",
    )
  await saveEvent(
    clubId,
    {
      title: String(formData.get("title")),
      description: String(formData.get("description")),
      startsAt: startsAtRaw,
      locationText: String(formData.get("locationText")),
      distanceOptions: String(formData.get("distanceOptions"))
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      paymentInfo: String(formData.get("paymentInfo")),
      coverImageUrl,
      eventType: eventType in EventType ? (eventType as EventType) : null,
      registrationDeadline: parseLocalDateTime(String(formData.get("registrationDeadline") ?? "")),
      expectedRunners: Number.isFinite(rawRunners) ? rawRunners : null,
      hasFinisherMedal: formData.get("hasFinisherMedal") === "on",
      logistics: String(formData.get("logistics") ?? "") || null,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    },
    id,
  )
  redirect("/organiser/dashboard")
}

export async function uploadPhotos(eventId: string, formData: FormData) {
  const { clubId } = await requireOrganiser()
  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0)
  if (files.length === 0) return
  await assertCanAddPhotos(eventId, clubId, files.length)
  for (const file of files) {
    const fileError = validateImageFile(file)
    if (fileError) throw new Error(fileError)
  }
  const urls: string[] = []
  for (const file of files) {
    urls.push(await uploadEventImage(`events/${eventId}`, file))
  }
  await createEventPhotos(eventId, urls)
  revalidatePath(`/organiser/events/${eventId}/edit`)
}

export async function saveCaption(
  eventId: string,
  photoId: string,
  formData: FormData,
) {
  const { clubId } = await requireOrganiser()
  await updateEventPhotoCaption(photoId, clubId, String(formData.get("caption") ?? ""))
  revalidatePath(`/organiser/events/${eventId}/edit`)
}

export async function removePhoto(eventId: string, photoId: string) {
  const { clubId } = await requireOrganiser()
  const url = await deleteEventPhoto(photoId, clubId)
  await del(url).catch(() => {})
  revalidatePath(`/organiser/events/${eventId}/edit`)
}
