import { describe, expect, it } from "vitest";
import {
  isWithinForecastWindow,
  parseDailyForecast,
  weatherCodeLabel,
} from "@/lib/weather";

describe("isWithinForecastWindow", () => {
  const now = new Date("2026-07-16T08:00:00.000Z");

  it("rejects past events", () => {
    expect(isWithinForecastWindow(new Date("2026-07-15T08:00:00Z"), now)).toBe(
      false,
    );
  });

  it("accepts an event 10 days away", () => {
    expect(isWithinForecastWindow(new Date("2026-07-26T08:00:00Z"), now)).toBe(
      true,
    );
  });

  it("rejects an event 17 days away", () => {
    expect(isWithinForecastWindow(new Date("2026-08-02T08:00:00Z"), now)).toBe(
      false,
    );
  });
});

describe("weatherCodeLabel", () => {
  it.each([
    [0, "Clear"],
    [2, "Partly cloudy"],
    [3, "Overcast"],
    [45, "Fog"],
    [53, "Drizzle"],
    [63, "Rain"],
    [81, "Rain showers"],
    [95, "Thunderstorm"],
  ])("maps code %i to %s", (code, label) => {
    expect(weatherCodeLabel(code)).toBe(label);
  });
});

describe("parseDailyForecast", () => {
  const json = {
    daily: {
      time: ["2026-07-16", "2026-07-17"],
      weather_code: [0, 61],
      temperature_2m_max: [21.4, 18.2],
      temperature_2m_min: [8.6, 9.1],
      relative_humidity_2m_mean: [45.2, 80.7],
      wind_speed_10m_max: [12.3, 20.1],
    },
  };

  it("extracts the matching day", () => {
    expect(parseDailyForecast(json, "2026-07-17")).toEqual({
      label: "Rain",
      maxTempC: 18,
      minTempC: 9,
      humidityPct: 81,
      windKmh: 20,
    });
  });

  it("returns null when the date is missing", () => {
    expect(parseDailyForecast(json, "2026-08-01")).toBeNull();
  });

  it("returns null for malformed payloads", () => {
    expect(parseDailyForecast({}, "2026-07-16")).toBeNull();
    expect(parseDailyForecast(null, "2026-07-16")).toBeNull();
    expect(parseDailyForecast({ daily: { time: "x" } }, "2026-07-16")).toBeNull();
  });
});
