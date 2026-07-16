const PATTERNS = [
  /^(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/,
  /@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/,
  /[?&](?:q|query|ll|destination)=(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/,
]

export function parseLatLng(
  input: string,
): { lat: number; lng: number } | null {
  let text = input.trim()
  if (!text) return null
  try {
    text = decodeURIComponent(text)
  } catch {
    return null
  }
  for (const pattern of PATTERNS) {
    const match = text.match(pattern)
    if (!match) continue
    const lat = Number.parseFloat(match[1])
    const lng = Number.parseFloat(match[2])
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng }
  }
  return null
}
