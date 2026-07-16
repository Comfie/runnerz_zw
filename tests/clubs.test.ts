import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getPublicClub } from "@/lib/clubs";

let verifiedId: string;
let unverifiedId: string;

beforeAll(async () => {
  const verified = await db.club.create({
    data: { name: "Public AC", contact: "c", verified: true },
  });
  const unverified = await db.club.create({
    data: { name: "Hidden AC", contact: "c", verified: false },
  });
  verifiedId = verified.id;
  unverifiedId = unverified.id;
  const base = {
    description: "d",
    locationText: "H",
    distanceOptions: ["5k"],
    paymentInfo: "p",
    clubId: verified.id,
    status: "PUBLISHED" as const,
  };
  await db.event.create({
    data: { ...base, title: "Future", startsAt: new Date(Date.now() + 86400000) },
  });
  await db.event.create({
    data: { ...base, title: "Past", startsAt: new Date(Date.now() - 86400000) },
  });
  await db.event.create({
    data: {
      ...base,
      title: "Draft",
      status: "DRAFT",
      startsAt: new Date(Date.now() + 86400000),
    },
  });
});

afterAll(async () => {
  await db.event.deleteMany();
  await db.club.deleteMany();
});

describe("getPublicClub", () => {
  it("returns null for an unverified club", async () => {
    expect(await getPublicClub(unverifiedId)).toBeNull();
  });

  it("returns null for a missing club", async () => {
    expect(await getPublicClub("nope")).toBeNull();
  });

  it("returns upcoming published events and past count", async () => {
    const result = await getPublicClub(verifiedId);
    expect(result?.club.name).toBe("Public AC");
    expect(result?.upcomingEvents.map((e) => e.title)).toEqual(["Future"]);
    expect(result?.pastEventCount).toBe(1);
  });
});
