import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { registerForEvent } from "@/lib/registrations";

const details = (distance: string) => ({
  distance,
  fullName: "Runner One",
  gender: "FEMALE" as const,
  dateOfBirth: new Date("1990-01-01T00:00:00+02:00"),
  emergencyName: "Contact",
  emergencyPhone: "+263771234567",
  tshirtSize: null,
});

let userId: string;
let eventId: string;

beforeAll(async () => {
  const club = await db.club.create({ data: { name: "C", contact: "c" } });
  const e = await db.event.create({
    data: {
      title: "E",
      description: "d",
      startsAt: new Date(),
      locationText: "H",
      distanceOptions: ["5k", "10k"],
      paymentInfo: "p",
      clubId: club.id,
      status: "PUBLISHED",
    },
  });
  const u = await db.user.create({
    data: { name: "R", phone: "+263770000000" },
  });
  eventId = e.id;
  userId = u.id;
});

afterAll(async () => {
  await db.registration.deleteMany();
  await db.event.deleteMany();
  await db.user.deleteMany();
  await db.club.deleteMany();
});

describe("registerForEvent", () => {
  it("creates a REGISTERED registration for a valid distance", async () => {
    const r = await registerForEvent(userId, eventId, details("10k"));
    expect(r.status).toBe("REGISTERED");
    expect(r.distance).toBe("10k");
    expect(r.fullName).toBe("Runner One");
    expect(r.waiverAcceptedAt).toBeInstanceOf(Date);
  });

  it("is idempotent: re-registering updates, does not duplicate", async () => {
    await registerForEvent(userId, eventId, details("5k"));
    const count = await db.registration.count({ where: { userId, eventId } });
    expect(count).toBe(1);
  });

  it("rejects a distance the event does not offer", async () => {
    await expect(registerForEvent(userId, eventId, details("42k"))).rejects.toThrow(
      "invalid distance",
    );
  });
});
