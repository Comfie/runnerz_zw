export function getCountdownLabel(startsAt: Date, now = new Date()): string | null {
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const eventUtc = Date.UTC(
    startsAt.getUTCFullYear(),
    startsAt.getUTCMonth(),
    startsAt.getUTCDate(),
  )
  const diff = Math.round((eventUtc - todayUtc) / (1000 * 60 * 60 * 24))
  if (diff < 0) return null
  if (diff === 0) return "Today!"
  if (diff === 1) return "Tomorrow"
  if (diff <= 7) return "This week"
  return `${diff} days away`
}
