"use server";

import { auth } from "@/lib/auth";
import { parseRegistrationForm, registerForEvent } from "@/lib/registrations";
import { redirect } from "next/navigation";

export type RegistrationState = {
  error: string | null;
  values: Record<string, string>;
};

const FIELDS = [
  "distance",
  "fullName",
  "gender",
  "dateOfBirth",
  "emergencyName",
  "emergencyPhone",
  "tshirtSize",
  "waiver",
];

export async function submitRegistration(
  eventId: string,
  _prev: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  const session = await auth();
  if (!session?.user) redirect(`/signin?redirectTo=/register/${eventId}`);

  const values = Object.fromEntries(FIELDS.map((f) => [f, String(formData.get(f) ?? "")]));
  const parsed = parseRegistrationForm(formData);
  if (!parsed.ok) return { error: parsed.error, values };

  try {
    await registerForEvent((session.user as { id: string }).id, eventId, parsed.data);
  } catch {
    return { error: "Registration is not available for this event or distance.", values };
  }
  redirect("/me");
}
