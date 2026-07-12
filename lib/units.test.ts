import { describe, expect, it } from "vitest";
import {
  cToF,
  formatLocalTime,
  formatTemp,
  formatWind,
  msToKmh,
  msToMph,
  timeAgo,
} from "./units";

describe("conversions", () => {
  it("converts celsius to fahrenheit", () => {
    expect(cToF(0)).toBe(32);
    expect(cToF(100)).toBe(212);
    expect(cToF(-40)).toBe(-40); // the crossover point
  });

  it("converts wind speeds from m/s", () => {
    expect(msToKmh(10)).toBeCloseTo(36);
    expect(msToMph(10)).toBeCloseTo(22.37, 1);
  });
});

describe("formatTemp", () => {
  it("rounds to whole degrees", () => {
    expect(formatTemp(18.4, "c")).toBe("18°");
    expect(formatTemp(18.5, "c")).toBe("19°");
  });

  it("converts before rounding in fahrenheit", () => {
    expect(formatTemp(21.5, "f")).toBe("71°"); // 70.7°F
  });

  it("never renders negative zero", () => {
    expect(formatTemp(-0.4, "c")).toBe("0°");
  });
});

describe("formatWind", () => {
  it("pairs km/h with celsius and mph with fahrenheit", () => {
    expect(formatWind(5, "c")).toBe("18 km/h");
    expect(formatWind(5, "f")).toBe("11 mph");
  });
});

describe("formatLocalTime", () => {
  const noonUtc = Date.UTC(2026, 0, 15, 12, 0);

  it("shows the city's wall clock regardless of the viewer's timezone", () => {
    expect(formatLocalTime(0, noonUtc)).toBe("12:00");
    expect(formatLocalTime(9 * 3600, noonUtc)).toBe("21:00"); // Tokyo
    expect(formatLocalTime(-5 * 3600, noonUtc)).toBe("07:00"); // New York
  });
});

describe("timeAgo", () => {
  const now = 10 * 60_000;

  it("reports 'just now' under a minute", () => {
    expect(timeAgo(now - 30_000, now)).toBe("just now");
  });

  it("reports whole minutes", () => {
    expect(timeAgo(now - 3.5 * 60_000, now)).toBe("3 min ago");
  });
});
