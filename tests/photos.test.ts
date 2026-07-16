import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  MAX_PHOTOS_PER_EVENT,
  assertCanAddPhotos,
  createEventPhotos,
  deleteEventPhoto,
  updateEventPhotoCaption,
  validateImageFile,
} from "@/lib/photos";

let clubId: string;
let otherClubId: string;
let eventId: string;

beforeAll(async () => {
  const club = await db.club.create({
    data: { name: "Photo AC", contact: "p", verified: true },
  });
  const other = await db.club.create({
    data: { name: "Other AC", contact: "x", verified: true },
  });
  const e = await db.event.create({
    data: {
      title: "Photo Race",
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
  await db.eventPhoto.deleteMany();
  await db.event.deleteMany();
  await db.club.deleteMany();
});

describe("EventPhoto", () => {
  it("cascades photo deletion when the event is deleted", async () => {
    const e = await db.event.create({
      data: {
        title: "Temp",
        description: "d",
        startsAt: new Date(),
        locationText: "H",
        distanceOptions: ["5k"],
        paymentInfo: "p",
        clubId,
      },
    });
    await db.eventPhoto.create({
      data: { eventId: e.id, url: "https://example.com/a.jpg" },
    });
    await db.event.delete({ where: { id: e.id } });
    const remaining = await db.eventPhoto.count({ where: { eventId: e.id } });
    expect(remaining).toBe(0);
  });
});

describe("validateImageFile", () => {
  it("accepts a small jpeg", () => {
    expect(validateImageFile({ type: "image/jpeg", size: 1000 })).toBeNull();
  });

  it("rejects a pdf", () => {
    expect(validateImageFile({ type: "application/pdf", size: 1000 })).toMatch(
      /JPEG, PNG or WebP/,
    );
  });

  it("rejects files over 5 MB", () => {
    expect(
      validateImageFile({ type: "image/png", size: 5 * 1024 * 1024 + 1 }),
    ).toMatch(/5 MB/);
  });
});

describe("photo helpers", () => {
  it("refuses to add photos to another club's event", async () => {
    await expect(assertCanAddPhotos(eventId, otherClubId, 1)).rejects.toThrow(
      "not your event",
    );
  });

  it("enforces the photo cap", async () => {
    await expect(
      assertCanAddPhotos(eventId, clubId, MAX_PHOTOS_PER_EVENT + 1),
    ).rejects.toThrow("photo limit reached");
  });

  it("creates, captions, and deletes photos with ownership checks", async () => {
    await createEventPhotos(eventId, ["https://example.com/1.jpg"]);
    const photo = await db.eventPhoto.findFirstOrThrow({ where: { eventId } });

    await expect(
      updateEventPhotoCaption(photo.id, otherClubId, "x"),
    ).rejects.toThrow("not your photo");
    await updateEventPhotoCaption(photo.id, clubId, "Start line");
    const updated = await db.eventPhoto.findUniqueOrThrow({
      where: { id: photo.id },
    });
    expect(updated.caption).toBe("Start line");

    await expect(deleteEventPhoto(photo.id, otherClubId)).rejects.toThrow(
      "not your photo",
    );
    const url = await deleteEventPhoto(photo.id, clubId);
    expect(url).toBe("https://example.com/1.jpg");
    expect(await db.eventPhoto.count({ where: { eventId } })).toBe(0);
  });
});
