export const TIME_ZONE = "Africa/Harare"
const OFFSET = "+02:00"

export function fmtTime(d: Date): string {
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  })
}

export function fmtDate(d: Date, opts: Intl.DateTimeFormatOptions = {}): string {
  return d.toLocaleDateString("en-GB", { timeZone: TIME_ZONE, ...opts })
}

export function fmtShortDate(d: Date): string {
  return fmtDate(d, { day: "numeric", month: "short", year: "numeric" })
}

export function dateParts(d: Date) {
  return {
    weekday: fmtDate(d, { weekday: "short" }),
    month: fmtDate(d, { month: "short" }),
    day: fmtDate(d, { day: "numeric" }),
  }
}

export function localDayKey(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: TIME_ZONE })
}

export function parseLocalDateTime(value: string): Date | null {
  if (!value) return null
  const hasZone = /(Z|[+-]\d{2}:\d{2})$/.test(value)
  const withSeconds = /T\d{2}:\d{2}$/.test(value) ? `${value}:00` : value
  const d = new Date(hasZone ? value : `${withSeconds}${OFFSET}`)
  return isNaN(d.getTime()) ? null : d
}

export function toLocalInputValue(d: Date | null | undefined): string {
  if (!d) return ""
  const shifted = new Date(d.getTime() + 2 * 60 * 60 * 1000)
  return shifted.toISOString().slice(0, 16)
}
