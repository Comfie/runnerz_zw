import { describe, expect, it } from "vitest";
import { toCsv, toRegistrationRow, type Row } from "@/lib/csv";

const base: Row = {
  name: "Ann",
  contact: "a@x.z",
  distance: "10k",
  category: "Female",
  dateOfBirth: "1990-05-01",
  emergencyName: "Bob",
  emergencyPhone: "+263771234567",
  tshirtSize: "M",
  waiverAccepted: "Yes",
  status: "REGISTERED",
  registeredAt: "2026-07-07",
};

describe("toCsv", () => {
  it("emits a header and a row", () => {
    const out = toCsv([base]);
    expect(out.split("\n")[0]).toBe(
      "Name,Contact,Distance,Category,Date of Birth,Emergency Contact,Emergency Phone,T-shirt,Waiver Accepted,Status,Registered At",
    );
    expect(out).toContain(
      "Ann,a@x.z,10k,Female,1990-05-01,Bob,+263771234567,M,Yes,REGISTERED,2026-07-07",
    );
  });

  it("quotes fields containing commas", () => {
    const out = toCsv([{ ...base, name: "Doe, John" }]);
    expect(out).toContain('"Doe, John"');
  });
});

describe("toRegistrationRow", () => {
  const user = { name: "Account Name", email: null, phone: "+263770000000" };

  it("prefers the registration's full name and uses Harare dates", () => {
    const row = toRegistrationRow({
      distance: "21k",
      status: "PAID",
      createdAt: new Date("2026-09-22T23:30:00.000Z"),
      fullName: "Tendai Moyo",
      gender: "MALE",
      dateOfBirth: new Date("1992-03-14T22:00:00.000Z"),
      emergencyName: "Rudo",
      emergencyPhone: "+263772000000",
      tshirtSize: "L",
      waiverAcceptedAt: new Date(),
      user,
    });
    expect(row).toMatchObject({
      name: "Tendai Moyo",
      contact: "+263770000000",
      category: "Male",
      dateOfBirth: "1992-03-15",
      waiverAccepted: "Yes",
      registeredAt: "2026-09-23",
    });
  });

  it("falls back to the account name for legacy registrations", () => {
    const row = toRegistrationRow({
      distance: "5k",
      status: "REGISTERED",
      createdAt: new Date("2026-07-07T08:00:00.000Z"),
      fullName: null,
      gender: null,
      dateOfBirth: null,
      emergencyName: null,
      emergencyPhone: null,
      tshirtSize: null,
      waiverAcceptedAt: null,
      user,
    });
    expect(row).toMatchObject({ name: "Account Name", category: "", waiverAccepted: "No" });
  });
});
