"use server";

import { requireOrganiser, setEventStatus } from "@/lib/organisers";
import { revalidatePath } from "next/cache";

export async function updateEventStatus(eventId: string, status: "DRAFT" | "PUBLISHED") {
  const { clubId } = await requireOrganiser();
  await setEventStatus(eventId, clubId, status);
  revalidatePath("/organiser/dashboard");
  revalidatePath("/");
}
