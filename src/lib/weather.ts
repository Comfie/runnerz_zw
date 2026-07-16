export type RaceDayWeather = {
  label: string
  maxTempC: number
  minTempC: number
  humidityPct: number
  windKmh: number
}

const FORECAST_DAYS = 16

export function isWithinForecastWindow(startsAt: Date, now = new Date()) {
  if (startsAt < now) return false
  return startsAt.getTime() - now.getTime() <= FORECAST_DAYS * 86400000
}

export function weatherCodeLabel(code: number): string {
  if (code === 0) return "Clear"
  if (code <= 2) return "Partly cloudy"
  if (code === 3) return "Overcast"
  if (code === 45 || code === 48) return "Fog"
  if (code >= 51 && code <= 57) return "Drizzle"
  if (code >= 61 && code <= 67) return "Rain"
  if (code >= 71 && code <= 77) return "Snow"
  if (code >= 80 && code <= 82) return "Rain showers"
  if (code >= 95) return "Thunderstorm"
  return "Mixed"
}

export function parseDailyForecast(
  json: unknown,
  dateISO: string,
): RaceDayWeather | null {
  const daily = (json as { daily?: Record<string, unknown> } | null)?.daily
  if (!daily || !Array.isArray(daily.time)) return null
  const i = daily.time.indexOf(dateISO)
  if (i === -1) return null
  const num = (key: string) => {
    const arr = daily[key]
    return Array.isArray(arr) && typeof arr[i] === "number"
      ? (arr[i] as number)
      : null
  }
  const code = num("weather_code")
  const max = num("temperature_2m_max")
  const min = num("temperature_2m_min")
  const humidity = num("relative_humidity_2m_mean")
  const wind = num("wind_speed_10m_max")
  if (
    code === null ||
    max === null ||
    min === null ||
    humidity === null ||
    wind === null
  )
    return null
  return {
    label: weatherCodeLabel(code),
    maxTempC: Math.round(max),
    minTempC: Math.round(min),
    humidityPct: Math.round(humidity),
    windKmh: Math.round(wind),
  }
}

export async function getRaceDayWeather(
  lat: number,
  lng: number,
  startsAt: Date,
): Promise<RaceDayWeather | null> {
  if (!isWithinForecastWindow(startsAt)) return null
  try {
    const dateISO = startsAt.toLocaleDateString("en-CA", {
      timeZone: "Africa/Harare",
    })
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,wind_speed_10m_max` +
      `&timezone=Africa%2FHarare&forecast_days=${FORECAST_DAYS}`
    const res = await fetch(url, {
      next: { revalidate: 10800 },
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return null
    return parseDailyForecast(await res.json(), dateISO)
  } catch {
    return null
  }
}
