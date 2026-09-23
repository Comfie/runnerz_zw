import { describe, it, expect } from "vitest"
import { getCountdownLabel } from "@/lib/countdown"

describe("getCountdownLabel", () => {
  const now = new Date("2026-07-07T12:00:00.000Z")

  it("returns null for a past event", () => {
    expect(getCountdownLabel(new Date("2026-07-06T21:59:59.000Z"), now)).toBeNull()
  })

  it("returns 'Today!' for an event earlier today", () => {
    expect(getCountdownLabel(new Date("2026-07-07T06:00:00.000Z"), now)).toBe("Today!")
  })

  it("returns 'Today!' for an event late tonight in Harare", () => {
    expect(getCountdownLabel(new Date("2026-07-07T21:00:00.000Z"), now)).toBe("Today!")
  })

  it("uses the Harare calendar day, not the UTC day", () => {
    expect(getCountdownLabel(new Date("2026-07-07T22:30:00.000Z"), now)).toBe("Tomorrow")
  })

  it("returns 'Tomorrow' for 1 day away", () => {
    expect(getCountdownLabel(new Date("2026-07-08T08:00:00.000Z"), now)).toBe("Tomorrow")
  })

  it("returns 'This week' for 2 days away", () => {
    expect(getCountdownLabel(new Date("2026-07-09T08:00:00.000Z"), now)).toBe("This week")
  })

  it("returns 'This week' for 7 days away", () => {
    expect(getCountdownLabel(new Date("2026-07-14T08:00:00.000Z"), now)).toBe("This week")
  })

  it("returns '{N} days away' for exactly 8 days", () => {
    expect(getCountdownLabel(new Date("2026-07-15T08:00:00.000Z"), now)).toBe("8 days away")
  })

  it("returns '{N} days away' for 8+ days", () => {
    expect(getCountdownLabel(new Date("2026-08-01T08:00:00.000Z"), now)).toBe("25 days away")
  })
})
