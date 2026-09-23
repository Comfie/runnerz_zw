import { describe, expect, it } from "vitest"
import {
  dateParts,
  fmtTime,
  parseLocalDateTime,
  toLocalInputValue,
} from "@/lib/format"

describe("format (Africa/Harare)", () => {
  const raceStart = new Date("2026-10-10T04:00:00.000Z")

  it("formats times in Harare time regardless of server zone", () => {
    expect(fmtTime(raceStart)).toBe("06:00")
  })

  it("uses the Harare calendar day for date parts", () => {
    const lateUtc = new Date("2026-10-09T23:00:00.000Z")
    expect(dateParts(lateUtc)).toEqual({ weekday: "Sat", month: "Oct", day: "10" })
  })

  it("parses datetime-local input as Harare wall time", () => {
    expect(parseLocalDateTime("2026-10-10T06:00")?.toISOString()).toBe(
      "2026-10-10T04:00:00.000Z",
    )
  })

  it("returns null for empty or invalid input", () => {
    expect(parseLocalDateTime("")).toBeNull()
    expect(parseLocalDateTime("not a date")).toBeNull()
  })

  it("round-trips through the datetime-local input value", () => {
    expect(toLocalInputValue(raceStart)).toBe("2026-10-10T06:00")
    expect(parseLocalDateTime(toLocalInputValue(raceStart))).toEqual(raceStart)
  })
})
