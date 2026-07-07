import { describe, expect, it } from "vitest";
import { buildClubApprovedEmail } from "@/lib/email";

describe("buildClubApprovedEmail", () => {
  it("builds a styled club approval email", () => {
    const email = buildClubApprovedEmail({
      clubName: "Harare Runners",
      organiserName: "Comfort",
      dashboardUrl: "https://runzw.example/organiser/dashboard",
    });

    expect(email.subject).toBe("Harare Runners has been approved on RunZW");
    expect(email.text).toContain("Harare Runners has been approved");
    expect(email.html).toContain("Harare Runners");
    expect(email.html).toContain("https://runzw.example/organiser/dashboard");
    expect(email.html).toContain("background:");
  });
});
