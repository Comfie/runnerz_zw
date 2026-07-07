"use server";

import { approveClub, requireAdmin, setEventStatusAsAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { saveEvent } from "@/lib/organisers";
import { sendClubApprovedEmail } from "@/lib/send";
import { revalidatePath } from "next/cache";

export async function approveClubAction(clubId: string) {
  await requireAdmin();
  const club = await approveClub(clubId);
  const clubWithOwner = await db.club.findUnique({
    where: { id: club.id },
    include: { owner: true },
  });

  const recipient =
    clubWithOwner?.owner?.email ??
    (clubWithOwner?.contact.includes("@") ? clubWithOwner.contact : null);

  if (clubWithOwner && recipient) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    await sendClubApprovedEmail({
      to: recipient,
      clubName: clubWithOwner.name,
      organiserName: clubWithOwner.owner?.name,
      dashboardUrl: `${appUrl}/organiser/dashboard`,
    });
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/clubs/${clubId}`);
}

export async function setAdminEventStatus(
  eventId: string,
  status: "DRAFT" | "PUBLISHED",
) {
  await requireAdmin();
  await setEventStatusAsAdmin(eventId, status);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function createClub(formData: FormData) {
  await requireAdmin();
  await db.club.create({
    data: {
      name: String(formData.get("name")),
      contact: String(formData.get("contact")),
      verified: true,
    },
  });
  revalidatePath("/admin");
}

export async function seedEvent(formData: FormData) {
  await requireAdmin();
  await saveEvent(String(formData.get("clubId")), {
    title: String(formData.get("title")),
    description: String(formData.get("description")),
    startsAt: new Date(String(formData.get("startsAt"))),
    locationText: String(formData.get("locationText")),
    distanceOptions: String(formData.get("distanceOptions"))
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    paymentInfo: String(formData.get("paymentInfo")),
  });
  revalidatePath("/admin");
}
