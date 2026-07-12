"use client";

import { Button } from "react-aria-components";
import type { City } from "@/lib/types";

// starters ship with coordinates, so adding one costs zero geocoding calls
const STARTERS: City[] = [
  { name: "London", country: "GB", lat: 51.5073, lon: -0.1276 },
  { name: "Newcastle upon Tyne", country: "GB", lat: 54.9783, lon: -1.6178 },
  { name: "Prague", country: "CZ", lat: 50.0755, lon: 14.4378 },
  { name: "Tokyo", country: "JP", lat: 35.6828, lon: 139.7595 },
];

/** First-visit view: one sentence of direction and four one-tap starters. */
export default function EmptyState({ onAdd }: { onAdd: (city: City) => void }) {
  return (
    <section
      aria-label="Get started"
      className="flex flex-1 animate-pop-in flex-col items-center justify-center gap-4 rounded-3xl border-3 border-dotted border-slate-400/60 px-6 py-16 text-center"
    >
      <p aria-hidden className="text-5xl">
        ☂️
      </p>
      <div>
        <h2 className="text-lg font-semibold">No cities yet</h2>
        <p className="mt-1 text-sm font-medium text-slate-600">
          Search for a city above, or start with one of these:
        </p>
      </div>
      <ul className="flex flex-wrap justify-center gap-2">
        {STARTERS.map((city) => (
          <li key={city.name}>
            <Button
              onPress={() => onAdd(city)}
              className="cursor-pointer rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-800 pressed:scale-95"
            >
              {city.name}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
