import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/csv";

describe("toCsv", () => {
  it("emits a header and a row", () => {
    const out = toCsv([
      {
        name: "Ann",
        contact: "a@x.z",
        distance: "10k",
        status: "REGISTERED",
        registeredAt: "2026-07-07",
      },
    ]);
    expect(out.split("\n")[0]).toBe(
      "Name,Contact,Distance,Status,Registered At",
    );
    expect(out).toContain("Ann,a@x.z,10k,REGISTERED,2026-07-07");
  });

  it("quotes fields containing commas", () => {
    const out = toCsv([
      {
        name: "Doe, John",
        contact: "j",
        distance: "5k",
        status: "REGISTERED",
        registeredAt: "d",
      },
    ]);
    expect(out).toContain('"Doe, John"');
  });
});
