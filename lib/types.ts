/** A city on the dashboard, as returned by our /api/geocode route. */
export type City = {
  name: string;
  /** ISO 3166 country code, e.g. "GB". */
  country: string;
  /** Region/state where the geocoder provides one - disambiguates the many Springfields. */
  state?: string;
  lat: number;
  lon: number;
};

/**
 * Current conditions from our /api/weather route. Always metric - °F/mph are
 * derived client-side (lib/units.ts) so the unit toggle never refetches.
 */
export type Weather = {
  tempC: number;
  feelsLikeC: number;
  /** Relative humidity, %. */
  humidity: number;
  /** Atmospheric pressure, hPa. */
  pressure: number;
  /** Wind speed, m/s. */
  windMs: number;
  /** OpenWeather condition id, e.g. 500 = light rain. */
  conditionId: number;
  /** Human description, e.g. "light rain". */
  description: string;
  /** Daytime at the location, per OpenWeather's "d" icon suffix. */
  isDay: boolean;
  /** Offset from UTC, seconds. */
  timezoneOffset: number;
  /** Unix seconds. */
  sunrise: number;
  /** Unix seconds. */
  sunset: number;
  /** When our server fetched this from OpenWeather (ms) - cached responses keep their true age. */
  fetchedAt: number;
};
