import { describe, expect, it } from "vitest";
import { buildDistanceOptions, buildWhere } from "@/lib/events";

describe("buildWhere", () => {
  it("always restricts to PUBLISHED", () => {
    expect(buildWhere({}).status).toBe("PUBLISHED");
  });

  it("filters by distance via array contains", () => {
    expect(buildWhere({ distance: "10k" }).distanceOptions).toEqual({
      has: "10k",
    });
  });

  it("filters location case-insensitively", () => {
    expect(buildWhere({ location: "har" }).locationText).toEqual({
      contains: "har",
      mode: "insensitive",
    });
  });

  it("applies a date lower bound", () => {
    const from = new Date("2026-08-01");
    expect(buildWhere({ from }).startsAt).toEqual({ gte: from });
  });
});

describe("buildDistanceOptions", () => {
  it("derives unique distances from event distance options", () => {
    expect(
      buildDistanceOptions([
        { distanceOptions: ["10k", "40k"] },
        { distanceOptions: ["5k", "10k"] },
      ]),
    ).toEqual(["5k", "10k", "40k"]);
  });
});
