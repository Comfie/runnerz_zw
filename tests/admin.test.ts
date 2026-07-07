import { describe, expect, it } from "vitest";
import { summarizeClubsForAdmin } from "@/lib/admin";

describe("summarizeClubsForAdmin", () => {
  it("keeps approved and pending clubs visible", () => {
    const clubs = summarizeClubsForAdmin([
      { id: "1", name: "Approved AC", verified: true, _count: { events: 2, members: 1 } },
      { id: "2", name: "Pending AC", verified: false, _count: { events: 0, members: 0 } },
    ]);

    expect(clubs).toEqual([
      { id: "1", name: "Approved AC", status: "Approved", events: 2, members: 1 },
      { id: "2", name: "Pending AC", status: "Pending", events: 0, members: 0 },
    ]);
  });
});
