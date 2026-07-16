"use server";

import { redirect } from "next/navigation";
import { sendContactMessage } from "@/lib/send";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitContact(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message || !EMAIL_PATTERN.test(email)) {
    redirect("/contact?error=true");
  }

  await sendContactMessage({ name, email, message });
  redirect("/contact?sent=true");
}
