"use server";

import { requireOrganiser, saveEvent } from "@/lib/organisers";
import { redirect } from "next/navigation";

export async function createEvent(formData: FormData) {
  const { clubId } = await requireOrganiser();
  await saveEvent(clubId, {
    title: String(formData.get("title")),
    description: String(formData.get("description")),
    startsAt: new Date(String(formData.get("startsAt"))),
    locationText: String(formData.get("locationText")),
    distanceOptions: String(formData.get("distanceOptions"))
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    paymentInfo: String(formData.get("paymentInfo")),
    coverImageUrl: String(formData.get("coverImageUrl") ?? "") || null,
  });
  redirect("/organiser/dashboard");
}
