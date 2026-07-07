"use server";

import { db } from "@/lib/db";
import { requireOrganiser } from "@/lib/organisers";
import { redirect } from "next/navigation";

export async function updateClubProfile(formData: FormData) {
  const { clubId } = await requireOrganiser();
  await db.club.update({
    where: { id: clubId },
    data: {
      name: String(formData.get("name")),
      contact: String(formData.get("contact")),
      logoUrl: String(formData.get("logoUrl") ?? "") || null,
    },
  });
  redirect("/organiser/dashboard");
}
