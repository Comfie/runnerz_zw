import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";

describe("schema", () => {
  it("creates a club, event, user, registration", async () => {
    const club = await db.club.create({
      data: { name: "Test AC", contact: "x@y.z" },
    });
    const event = await db.event.create({
      data: {
        title: "Test 10k",
        description: "d",
        startsAt: new Date(),
        locationText: "Harare",
        distanceOptions: ["5k", "10k"],
        paymentInfo: "Pay on the day",
        clubId: club.id,
        status: "PUBLISHED",
      },
    });
    const user = await db.user.create({
      data: { name: "Runner", phone: "+263771234567" },
    });
    const reg = await db.registration.create({
      data: { userId: user.id, eventId: event.id, distance: "10k" },
    });
    expect(reg.status).toBe("REGISTERED");
  });

  afterAll(async () => {
    await db.registration.deleteMany();
    await db.event.deleteMany();
    await db.user.deleteMany();
    await db.club.deleteMany();
  });
});
