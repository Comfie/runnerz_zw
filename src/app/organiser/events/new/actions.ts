"use server"

import { requireOrganiser, saveEvent } from "@/lib/organisers"
import { redirect } from "next/navigation"
import { EventType } from "@prisma/client"

export async function createEvent(formData: FormData) {
  const { clubId } = await requireOrganiser()
  const eventType = String(formData.get("eventType") ?? "")
  const startsAtRaw = new Date(String(formData.get("startsAt") ?? ""))
  if (isNaN(startsAtRaw.getTime())) throw new Error("invalid startsAt")
  const rawRunners = parseInt(String(formData.get("expectedRunners") ?? ""), 10)
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
    coverImageUrl: String(formData.get("coverImageUrl") ?? "") || null,
    eventType: eventType in EventType ? (eventType as EventType) : null,
    registrationDeadline: formData.get("registrationDeadline")
      ? new Date(String(formData.get("registrationDeadline")))
      : null,
    expectedRunners: Number.isFinite(rawRunners) ? rawRunners : null,
    hasFinisherMedal: formData.get("hasFinisherMedal") === "on",
    logistics: String(formData.get("logistics") ?? "") || null,
  })
  redirect("/organiser/dashboard")
}
