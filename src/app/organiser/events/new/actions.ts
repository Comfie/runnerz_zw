"use server"

import { requireOrganiser, saveEvent } from "@/lib/organisers"
import { redirect } from "next/navigation"
import { EventType } from "@prisma/client"
import { uploadEventImage } from "@/lib/blob"
import { validateImageFile } from "@/lib/photos"
import { parseLatLng } from "@/lib/geo"
import { parseLocalDateTime } from "@/lib/format"

export async function createEvent(formData: FormData) {
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
  await saveEvent(clubId, {
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
  })
  redirect("/organiser/dashboard")
}
