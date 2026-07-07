import { createHash, randomInt } from "node:crypto";

export function normaliseContact(raw: string): {
  contact: string;
  channel: "email" | "sms";
} {
  const v = raw.trim();
  if (v.includes("@")) return { contact: v.toLowerCase(), channel: "email" };

  const digits = v.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return { contact: digits, channel: "sms" };

  const local = digits.replace(/^0/, "");
  return { contact: `+263${local}`, channel: "sms" };
}

export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashCode(code: string): string {
  return createHash("sha256")
    .update(`${code}:${process.env.AUTH_SECRET}`)
    .digest("hex");
}

export function verifyCode(input: string, hash: string): boolean {
  return hashCode(input) === hash;
}
