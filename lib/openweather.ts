// Shared bits for the OpenWeather proxy routes (route files may only export
// handlers, so these live in lib).

export const OPENWEATHER_HOST = "https://api.openweathermap.org";

// Cache tag on the weather route's upstream fetch. Lives here, once - a
// rename that touched only one side would fail silently.
export const WEATHER_TAG = "weather";

// Per-location tag alongside WEATHER_TAG, so one city can be force-refreshed
// (a stale re-add) without expiring every city's cache. Both routes derive it
// the same way, so the GET tag and refresh tag match for the same coordinates.
export function weatherTag(lat: number, lon: number): string {
  return `${WEATHER_TAG}:${lat},${lon}`;
}

/** Every API route answers errors as `{ error }` plus a status. */
export function jsonError(error: string, status: number): Response {
  return Response.json({ error }, { status });
}
