"use client";

import { useState } from "react";
import { Button } from "react-aria-components";
import CitySearch from "@/components/CitySearch";
import { addCity, removeCity, useCities } from "@/hooks/useCities";
import { cityKey } from "@/lib/cityKey";
import type { City } from "@/lib/types";

// Intentionally a client component: everything hangs off browser state
// (localStorage cities). The server still renders the shell as real HTML.

export default function Home() {
  const cities = useCities();
  const [announcement, setAnnouncement] = useState("");

  function handleAdd(city: City) {
    addCity(city);
    setAnnouncement(`${city.name} added to the dashboard`);
  }

  function handleRemove(city: City) {
    removeCity(city);
    setAnnouncement(`${city.name} removed`);
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6 lg:gap-8 lg:p-8">
      <header className="flex items-center justify-between rounded-full bg-white py-2 pr-2 pl-6">
        <h1 className="text-xl font-bold">brolly</h1>
      </header>

      <CitySearch onAdd={handleAdd} />

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cities.map((city) => (
          <li
            key={cityKey(city)}
            className="flex items-center justify-between rounded-3xl bg-white p-5"
          >
            <span className="font-semibold">
              {city.name}{" "}
              <span className="text-xs font-medium text-slate-500">
                {city.country}
              </span>
            </span>
            <Button
              onPress={() => handleRemove(city)}
              className="cursor-pointer rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>

      {/* announces add/remove to screen readers without moving focus */}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </main>
  );
}
