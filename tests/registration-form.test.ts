import { describe, expect, it } from "vitest";
import { parseRegistrationForm } from "@/lib/registrations";

function form(overrides: Record<string, string | null> = {}) {
  const values: Record<string, string | null> = {
    distance: "10k",
    fullName: "Tendai Moyo",
    gender: "MALE",
    dateOfBirth: "1992-03-15",
    emergencyName: "Rudo Moyo",
    emergencyPhone: "+263 77 123 4567",
    tshirtSize: "M",
    waiver: "on",
    ...overrides,
  };
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) if (v !== null) fd.set(k, v);
  return fd;
}

const now = new Date("2026-09-23T10:00:00.000Z");

describe("parseRegistrationForm", () => {
  it("accepts a complete form", () => {
    const r = parseRegistrationForm(form(), now);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toMatchObject({ fullName: "Tendai Moyo", gender: "MALE", tshirtSize: "M" });
    expect(r.data.dateOfBirth.toISOString()).toBe("1992-03-14T22:00:00.000Z");
  });

  it("treats an empty T-shirt size as no preference", () => {
    const r = parseRegistrationForm(form({ tshirtSize: "" }), now);
    expect(r.ok && r.data.tshirtSize).toBeNull();
  });

  it.each([
    ["distance", { distance: "" }, "distance"],
    ["name", { fullName: "T" }, "full name"],
    ["category", { gender: "" }, "category"],
    ["future DOB", { dateOfBirth: "2030-01-01" }, "date of birth"],
    ["emergency name", { emergencyName: "" }, "emergency contact name"],
    ["emergency phone", { emergencyPhone: "abc" }, "phone"],
    ["T-shirt", { tshirtSize: "XXXXL" }, "T-shirt"],
    ["waiver", { waiver: null }, "waiver"],
  ])("rejects a missing or invalid %s", (_label, overrides, message) => {
    const r = parseRegistrationForm(form(overrides), now);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.toLowerCase()).toContain(message.toLowerCase());
  });
});
