import { localDayKey } from "@/lib/format"

const DAY_MS = 1000 * 60 * 60 * 24

export function getCountdownLabel(startsAt: Date, now = new Date()): string | null {
  const today = Date.parse(localDayKey(now))
  const eventDay = Date.parse(localDayKey(startsAt))
  const diff = Math.round((eventDay - today) / DAY_MS)
  if (diff < 0) return null
  if (diff === 0) return "Today!"
  if (diff === 1) return "Tomorrow"
  if (diff <= 7) return "This week"
  return `${diff} days away`
}
