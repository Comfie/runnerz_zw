"use server";

import { db } from "@/lib/db";
import { generateCode, hashCode, normaliseContact } from "@/lib/otp";
import { sendOtp } from "@/lib/send";

export async function requestOtp(formData: FormData) {
  const { contact, channel } = normaliseContact(
    String(formData.get("contact") ?? ""),
  );

  if (channel === "sms" && !contact.startsWith("+263")) {
    return { error: "Please use a Zimbabwean phone number or an email address." };
  }

  const now = Date.now();
  const justSent = await db.otpCode.count({
    where: { contact, createdAt: { gt: new Date(now - 60_000) } },
  });
  if (justSent > 0) {
    return { error: "Code already sent. Wait a minute before retrying." };
  }

  const lastHour = await db.otpCode.count({
    where: { contact, createdAt: { gt: new Date(now - 3_600_000) } },
  });
  if (lastHour >= 5) {
    return { error: "Too many codes requested. Try again later." };
  }

  const code = generateCode();
  await db.otpCode.create({
    data: {
      contact,
      codeHash: hashCode(code),
      expiresAt: new Date(now + 10 * 60_000),
    },
  });
  await sendOtp(contact, channel, code);
  return { contact };
}
