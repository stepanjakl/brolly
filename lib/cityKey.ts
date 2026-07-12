import type { City } from "./types";

/**
 * A city's identity: name + country + ~1 km coordinate bucket. Rounding
 * dedupes repeat geocodes of the same place (they jitter slightly); the name
 * keeps nearby localities from colliding. Also used as React list keys and
 * search option ids. Lives in lib (not the hooks) so the geocode route can
 * import it - server code can't touch "use client" modules.
 */
export function cityKey(
  city: Pick<City, "name" | "country" | "lat" | "lon">,
): string {
  return `${city.name}|${city.country}|${city.lat.toFixed(2)},${city.lon.toFixed(2)}`;
}
