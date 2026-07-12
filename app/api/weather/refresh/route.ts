import { revalidateTag } from "next/cache";
import { WEATHER_TAG } from "@/lib/openweather";

// Hard refresh: expires every cached weather fetch immediately, so the next
// GET /api/weather per location is a real upstream call. { expire: 0 } rather
// than the default stale-while-revalidate profile - the button behind this
// promises current data, not the old numbers one more time. Costs one
// upstream call per city on the shared rate-limit budget.
export function POST() {
  revalidateTag(WEATHER_TAG, { expire: 0 });
  return Response.json({ ok: true });
}
