import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { WEATHER_TAG, weatherTag } from "@/lib/openweather";

// Hard refresh: expires cached weather so the next GET is a real upstream call.
// { expire: 0 } over the default stale-while-revalidate - this promises current
// data, not the old numbers once more. With lat/lon it expires just that city
// (a stale re-add); the footer button sends no coords and expires every city.
export function POST(request: NextRequest) {
  const latRaw = request.nextUrl.searchParams.get("lat");
  const lonRaw = request.nextUrl.searchParams.get("lon");
  const lat = Number(latRaw);
  const lon = Number(lonRaw);
  const perCity =
    latRaw && lonRaw && Number.isFinite(lat) && Number.isFinite(lon);

  revalidateTag(perCity ? weatherTag(lat, lon) : WEATHER_TAG, { expire: 0 });
  return Response.json({ ok: true });
}
