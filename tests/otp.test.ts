import { describe, expect, it } from "vitest";
import {
  generateCode,
  hashCode,
  normaliseContact,
  verifyCode,
} from "@/lib/otp";

describe("normaliseContact", () => {
  it("detects email and lowercases", () => {
    expect(normaliseContact("Foo@Bar.com")).toEqual({
      contact: "foo@bar.com",
      channel: "email",
    });
  });

  it("treats digits as an E.164 Zimbabwe phone", () => {
    expect(normaliseContact("0771234567")).toEqual({
      contact: "+263771234567",
      channel: "sms",
    });
  });

  it("keeps an already-E.164 number", () => {
    expect(normaliseContact("+263771234567").contact).toBe("+263771234567");
  });
});

describe("code", () => {
  it("generates a 6-digit numeric code", () => {
    expect(generateCode()).toMatch(/^\d{6}$/);
  });

  it("verifies a hashed code and rejects a wrong one", () => {
    const h = hashCode("123456");
    expect(verifyCode("123456", h)).toBe(true);
    expect(verifyCode("000000", h)).toBe(false);
  });
});
