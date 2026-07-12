// Unit conversions and display formatting - all pure functions. Weather is
// fetched once in metric and converted at render time, so toggling °C/°F
// costs zero API calls.

export type Unit = "c" | "f";

export function cToF(c: number): number {
  return (c * 9) / 5 + 32;
}

export function msToKmh(ms: number): number {
  return ms * 3.6;
}

export function msToMph(ms: number): number {
  return ms * 2.236936;
}

/** "18°" - the +0 normalises Math.round(-0.4)'s negative zero, so we never render "-0°". */
export function formatTemp(tempC: number, unit: Unit): string {
  const value = unit === "c" ? tempC : cToF(tempC);
  return `${Math.round(value) + 0}°`;
}

/** km/h alongside °C, mph alongside °F. */
export function formatWind(windMs: number, unit: Unit): string {
  return unit === "c"
    ? `${Math.round(msToKmh(windMs))} km/h`
    : `${Math.round(msToMph(windMs))} mph`;
}

// shared formatter - Intl constructors are expensive and cards call this on every clock tick
const TIME_FORMAT = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

/**
 * The city's local wall-clock time, e.g. "14:32". Shifts the timestamp by the
 * city's UTC offset and formats as UTC, so the viewer's timezone never matters.
 */
export function formatLocalTime(
  timezoneOffsetSec: number,
  nowMs = Date.now(),
): string {
  return TIME_FORMAT.format(new Date(nowMs + timezoneOffsetSec * 1000));
}

// viewer-local, unlike TIME_FORMAT - the fetch happened on the viewer's clock
const FETCHED_AT_FORMAT = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
});

/** When the data was fetched, on the viewer's clock. */
export function formatFetchedAt(fetchedAtMs: number): string {
  return FETCHED_AT_FORMAT.format(fetchedAtMs);
}

/** Data age for the card footer: "just now", then "3 min ago". */
export function timeAgo(thenMs: number, nowMs = Date.now()): string {
  const minutes = Math.floor((nowMs - thenMs) / 60_000);
  if (minutes < 1) return "just now";
  return `${minutes} min ago`;
}
