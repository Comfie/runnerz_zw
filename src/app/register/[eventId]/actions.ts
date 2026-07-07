"use server";

import { auth } from "@/lib/auth";
import { registerForEvent } from "@/lib/registrations";
import { redirect } from "next/navigation";

export async function submitRegistration(eventId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect(`/signin?redirectTo=/register/${eventId}`);
  await registerForEvent(
    (session.user as { id: string }).id,
    eventId,
    String(formData.get("distance")),
  );
  redirect("/me");
}
