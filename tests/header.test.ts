import { describe, expect, it } from "vitest";
import { getHeaderNavigation } from "@/lib/header";

describe("getHeaderNavigation", () => {
  it("shows sign in and organiser apply for signed-out users", () => {
    expect(getHeaderNavigation(null, null)).toEqual([
      { href: "/me", label: "My runs", variant: "secondary" },
      { href: "/organiser/apply", label: "Organiser", variant: "secondary" },
      { href: "/signin", label: "Sign in", variant: "primary" },
    ]);
  });

  it("shows admin for admins", () => {
    expect(getHeaderNavigation({ role: "ADMIN" }, null)).toContainEqual({
      href: "/admin",
      label: "Admin",
      variant: "secondary",
    });
  });

  it("sends approved organisers to the dashboard", () => {
    expect(getHeaderNavigation({ role: "ORGANISER" }, { verified: true })).toContainEqual({
      href: "/organiser/dashboard",
      label: "Dashboard",
      variant: "secondary",
    });
  });
});
