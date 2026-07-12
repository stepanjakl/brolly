import { describe, expect, it } from "vitest";
import type { Weather } from "./types";
import { conditionOf, lookFor, lookOf, timeOfDay } from "./weather";

describe("conditionOf", () => {
  it("buckets OpenWeather condition ids", () => {
    expect(conditionOf(200)).toBe("thunder");
    expect(conditionOf(301)).toBe("drizzle");
    expect(conditionOf(511)).toBe("rain");
    expect(conditionOf(602)).toBe("snow");
    expect(conditionOf(741)).toBe("fog");
    expect(conditionOf(800)).toBe("clear");
    expect(conditionOf(804)).toBe("clouds");
  });
});

describe("timeOfDay", () => {
  // A tidy synthetic day: sunrise 06:00, sunset 18:00 (unix seconds).
  const sunrise = 6 * 3600;
  const sunset = 18 * 3600;

  it("detects golden hour within 45 minutes of sunrise/sunset", () => {
    expect(timeOfDay(sunrise + 30 * 60, sunrise, sunset)).toBe("dawn");
    expect(timeOfDay(sunset - 30 * 60, sunrise, sunset)).toBe("dusk");
  });

  it("splits the rest into day and night", () => {
    expect(timeOfDay(12 * 3600, sunrise, sunset)).toBe("day");
    expect(timeOfDay(23 * 3600, sunrise, sunset)).toBe("night");
    expect(timeOfDay(2 * 3600, sunrise, sunset)).toBe("night");
  });
});

describe("lookOf", () => {
  it("gives clear nights a moon and a dark gradient", () => {
    const look = lookOf(800, false, "night");
    expect(look.emoji).toBe("🌙");
    expect(look.ink).toBe("light");
    expect(look.gradient).toContain("slate-950");
  });

  it("gives clear days a sun on a light gradient", () => {
    const look = lookOf(800, true, "day");
    expect(look.emoji).toBe("☀️");
    expect(look.ink).toBe("dark");
  });

  it("falls back to the day look at golden hour for weather-dominant conditions", () => {
    expect(lookOf(500, true, "dusk")).toEqual(lookOf(500, true, "day"));
  });

  it("trusts OpenWeather's day/night flag for the emoji at the poles", () => {
    // Computed "day" but OpenWeather says night → night emoji, day-ish gradient.
    const look = lookOf(800, false, "day");
    expect(look.emoji).toBe("🌙");
  });

  it("lookFor wires a Weather reading through timeOfDay to the same look", () => {
    const noon = 12 * 3600;
    const weather = {
      conditionId: 800,
      isDay: true,
      sunrise: 6 * 3600,
      sunset: 18 * 3600,
    } as Weather;
    expect(lookFor(weather, noon * 1000)).toEqual(lookOf(800, true, "day"));
  });

  it("only ever pairs light ink with dark gradients and vice versa", () => {
    const ids = [210, 310, 502, 611, 731, 800, 803];
    for (const id of ids) {
      for (const tod of ["dawn", "day", "dusk", "night"] as const) {
        const look = lookOf(id, tod !== "night", tod);
        // Light ink (white text) must sit on dark tones; dark ink on light tones.
        const darkTones =
          /(?:from|via|to)-(?:slate|sky|indigo|violet|blue)-(?:6|7|8|9)\d\d/;
        if (look.ink === "light") {
          expect(look.gradient).toMatch(darkTones);
        } else {
          expect(look.gradient).not.toMatch(darkTones);
        }
      }
    }
  });
});
