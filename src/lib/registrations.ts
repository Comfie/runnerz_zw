import type { Gender } from "@prisma/client";
import { db } from "@/lib/db";
import { parseLocalDateTime } from "@/lib/format";

export const TSHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export type RegistrationDetails = {
  distance: string;
  fullName: string;
  gender: Gender;
  dateOfBirth: Date;
  emergencyName: string;
  emergencyPhone: string;
  tshirtSize: string | null;
};

export type ParseResult =
  | { ok: true; data: RegistrationDetails }
  | { ok: false; error: string };

const PHONE = /^\+?[\d\s-]{9,16}$/;

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export function parseRegistrationForm(formData: FormData, now = new Date()): ParseResult {
  const distance = text(formData, "distance");
  const fullName = text(formData, "fullName");
  const gender = text(formData, "gender");
  const dob = parseLocalDateTime(`${text(formData, "dateOfBirth")}T00:00`);
  const emergencyName = text(formData, "emergencyName");
  const emergencyPhone = text(formData, "emergencyPhone");
  const tshirtSize = text(formData, "tshirtSize");

  if (!distance) return { ok: false, error: "Choose a distance." };
  if (fullName.length < 3) return { ok: false, error: "Enter your full name." };
  if (gender !== "FEMALE" && gender !== "MALE")
    return { ok: false, error: "Select your race category." };
  if (!dob || dob >= now) return { ok: false, error: "Enter a valid date of birth." };
  if (emergencyName.length < 2)
    return { ok: false, error: "Enter an emergency contact name." };
  if (!PHONE.test(emergencyPhone))
    return { ok: false, error: "Enter a valid emergency contact phone number." };
  if (tshirtSize && !TSHIRT_SIZES.includes(tshirtSize))
    return { ok: false, error: "Select a valid T-shirt size." };
  if (formData.get("waiver") !== "on")
    return { ok: false, error: "You must accept the participation waiver to register." };

  return {
    ok: true,
    data: {
      distance,
      fullName,
      gender,
      dateOfBirth: dob,
      emergencyName,
      emergencyPhone,
      tshirtSize: tshirtSize || null,
    },
  };
}

export async function registerForEvent(
  userId: string,
  eventId: string,
  details: RegistrationDetails,
) {
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event || event.status !== "PUBLISHED") {
    throw new Error("event not available");
  }
  if (!event.distanceOptions.includes(details.distance)) {
    throw new Error("invalid distance");
  }

  const data = { ...details, waiverAcceptedAt: new Date() };
  return db.registration.upsert({
    where: { userId_eventId: { userId, eventId } },
    update: data,
    create: { userId, eventId, ...data },
  });
}

export function getLastRegistrationDetails(userId: string) {
  return db.registration.findFirst({
    where: { userId, fullName: { not: null } },
    orderBy: { createdAt: "desc" },
    select: {
      fullName: true,
      gender: true,
      dateOfBirth: true,
      emergencyName: true,
      emergencyPhone: true,
      tshirtSize: true,
    },
  });
}
