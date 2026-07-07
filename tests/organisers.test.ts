import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { saveEvent, setEventStatus } from "@/lib/organisers";

let clubId: string;
let otherClubId: string;
let eventId: string;

beforeAll(async () => {
  const club = await db.club.create({
    data: { name: "Owner AC", contact: "o", verified: true },
  });
  const other = await db.club.create({
    data: { name: "Other AC", contact: "x", verified: true },
  });
  const e = await db.event.create({
    data: {
      title: "E",
      description: "d",
      startsAt: new Date(),
      locationText: "H",
      distanceOptions: ["5k"],
      paymentInfo: "p",
      clubId: club.id,
    },
  });
  clubId = club.id;
  otherClubId = other.id;
  eventId = e.id;
});

afterAll(async () => {
  await db.event.deleteMany();
  await db.club.deleteMany();
});

describe("setEventStatus", () => {
  it("lets the owning club publish", async () => {
    const e = await setEventStatus(eventId, clubId, "PUBLISHED");
    expect(e.status).toBe("PUBLISHED");
  });

  it("refuses a club that does not own the event", async () => {
    await expect(setEventStatus(eventId, otherClubId, "DRAFT")).rejects.toThrow(
      "not your event",
    );
  });
});

describe("saveEvent", () => {
  it("refuses to update an event the club does not own", async () => {
    await expect(
      saveEvent(
        otherClubId,
        {
          title: "X",
          description: "d",
          startsAt: new Date(),
          locationText: "H",
          distanceOptions: ["5k"],
          paymentInfo: "p",
        },
        eventId,
      ),
    ).rejects.toThrow("not your event");
  });
});
