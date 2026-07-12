// Maps OpenWeather conditions to the app's visual language: an emoji glyph
// and a gradient that knows what time it is in that city. Emoji over icon
// images is deliberate - zero requests, zero assets, crisp at any size.
// Gradients are literal class strings: Tailwind scans source statically,
// so they must never be built dynamically.

import type { Weather } from "./types";

/** OpenWeather condition id → one of seven buckets. */
export type Condition =
  "thunder" | "drizzle" | "rain" | "snow" | "fog" | "clear" | "clouds";

export function conditionOf(id: number): Condition {
  if (id >= 200 && id < 300) return "thunder";
  if (id >= 300 && id < 400) return "drizzle";
  if (id >= 500 && id < 600) return "rain";
  if (id >= 600 && id < 700) return "snow";
  if (id >= 700 && id < 800) return "fog"; // mist, haze, dust, …
  if (id === 800) return "clear";
  return "clouds"; // 801-804
}

export type TimeOfDay = "dawn" | "day" | "dusk" | "night";

// how close to sunrise/sunset still counts as golden hour
const TWILIGHT_SEC = 45 * 60;

/**
 * Where the city sits in its day. Sunrise/sunset are absolute unix
 * timestamps, so no timezone maths - this compares moments, not clocks.
 */
export function timeOfDay(
  nowSec: number,
  sunriseSec: number,
  sunsetSec: number,
): TimeOfDay {
  if (Math.abs(nowSec - sunriseSec) <= TWILIGHT_SEC) return "dawn";
  if (Math.abs(nowSec - sunsetSec) <= TWILIGHT_SEC) return "dusk";
  return nowSec > sunriseSec && nowSec < sunsetSec ? "day" : "night";
}

export type WeatherLook = {
  emoji: string;
  gradient: string;
  /**
   * Which text colour is readable on this gradient. Gradients only use light
   * tones (100-300, "dark" ink) or dark tones (600-950, "light" ink) - never
   * the 400-500 midtones where neither passes WCAG AA.
   */
  ink: "light" | "dark";
};

type LookTable = Record<
  Condition,
  Partial<Record<TimeOfDay, WeatherLook>> & {
    day: WeatherLook;
    night: WeatherLook;
  }
>;

const LOOKS: LookTable = {
  clear: {
    dawn: {
      emoji: "🌅",
      gradient: "bg-linear-to-br from-rose-200 via-orange-200 to-sky-200",
      ink: "dark",
    },
    day: {
      emoji: "☀️",
      gradient: "bg-linear-to-br from-sky-200 via-sky-300 to-blue-300",
      ink: "dark",
    },
    dusk: {
      emoji: "🌇",
      gradient: "bg-linear-to-br from-orange-300 via-rose-300 to-indigo-300",
      ink: "dark",
    },
    night: {
      emoji: "🌙",
      gradient: "bg-linear-to-br from-slate-800 via-indigo-950 to-slate-950",
      ink: "light",
    },
  },
  clouds: {
    dawn: {
      emoji: "⛅",
      gradient: "bg-linear-to-br from-rose-200 via-slate-100 to-slate-300",
      ink: "dark",
    },
    day: {
      emoji: "⛅",
      gradient: "bg-linear-to-br from-sky-200 via-slate-100 to-slate-300",
      ink: "dark",
    },
    dusk: {
      emoji: "⛅",
      gradient: "bg-linear-to-br from-orange-200 via-slate-300 to-slate-400",
      ink: "dark",
    },
    night: {
      emoji: "☁️",
      gradient: "bg-linear-to-br from-slate-700 to-slate-900",
      ink: "light",
    },
  },
  drizzle: {
    day: {
      emoji: "🌦️",
      gradient: "bg-linear-to-br from-sky-300 via-slate-100 to-slate-300",
      ink: "dark",
    },
    night: {
      emoji: "🌧️",
      gradient: "bg-linear-to-br from-slate-700 to-sky-900",
      ink: "light",
    },
  },
  rain: {
    day: {
      emoji: "🌧️",
      gradient: "bg-linear-to-br from-sky-600 to-slate-700",
      ink: "light",
    },
    night: {
      emoji: "🌧️",
      gradient: "bg-linear-to-br from-slate-800 to-sky-950",
      ink: "light",
    },
  },
  thunder: {
    day: {
      emoji: "⛈️",
      gradient: "bg-linear-to-br from-slate-600 via-violet-800 to-slate-800",
      ink: "light",
    },
    night: {
      emoji: "⛈️",
      gradient: "bg-linear-to-br from-slate-900 via-violet-950 to-slate-950",
      ink: "light",
    },
  },
  snow: {
    day: {
      emoji: "🌨️",
      gradient: "bg-linear-to-br from-slate-100 to-sky-200",
      ink: "dark",
    },
    night: {
      emoji: "🌨️",
      gradient: "bg-linear-to-br from-slate-600 to-slate-800",
      ink: "light",
    },
  },
  fog: {
    day: {
      emoji: "🌫️",
      gradient: "bg-linear-to-br from-slate-300 to-slate-400",
      ink: "dark",
    },
    night: {
      emoji: "🌫️",
      gradient: "bg-linear-to-br from-slate-600 to-slate-700",
      ink: "light",
    },
  },
};

/**
 * The look for a condition at a moment in the city's day. Sky-dominant
 * conditions (clear/clouds) get dawn/dusk variants; for the rest the weather
 * dominates, so golden hour falls back to the day look. OpenWeather's isDay
 * flag wins over the computed time-of-day for the emoji - keeps polar edge
 * cases honest.
 */
export function lookOf(
  conditionId: number,
  isDay: boolean,
  tod: TimeOfDay,
): WeatherLook {
  const table = LOOKS[conditionOf(conditionId)];
  const look = table[tod] ?? table.day;
  if (!isDay && tod !== "night") return { ...look, emoji: table.night.emoji };
  return look;
}

/** Single source used by both the card and the detail sheet. */
export function lookFor(weather: Weather, nowMs: number): WeatherLook {
  return lookOf(
    weather.conditionId,
    weather.isDay,
    timeOfDay(nowMs / 1000, weather.sunrise, weather.sunset),
  );
}

// layout half of the emoji "well"; INK_CLASSES.well supplies the tint
export const WELL_CLASSES = "grid place-items-center rounded-full leading-none";

// text/control classes readable on each ink, defined next to the gradients
// they must contrast with
export const INK_CLASSES = {
  light: {
    text: "text-white",
    subtle: "text-white/75",
    well: "bg-white/15",
  },
  dark: {
    text: "text-slate-900",
    subtle: "text-slate-900/60",
    well: "bg-slate-900/10",
  },
} as const;
