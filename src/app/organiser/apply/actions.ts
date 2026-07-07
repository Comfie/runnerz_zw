"use server";

import { auth } from "@/lib/auth";
import { applyAsOrganiser } from "@/lib/organisers";
import { redirect } from "next/navigation";

export async function submitApplication(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  await applyAsOrganiser(
    (session.user as { id: string }).id,
    String(formData.get("clubName")),
    String(formData.get("contact")),
  );
  redirect("/organiser/pending");
}
