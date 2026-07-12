"use client";

import { useState, useSyncExternalStore } from "react";
import CityCard from "@/components/CityCard";
import CitySearch from "@/components/CitySearch";
import EmptyState from "@/components/EmptyState";
import UnitToggle from "@/components/UnitToggle";
import { addCity, removeCity, useCities } from "@/hooks/useCities";
import { useUnit } from "@/hooks/useUnit";
import { cityKey } from "@/lib/cityKey";
import type { City } from "@/lib/types";

// Intentionally a client component: everything hangs off browser state
// (localStorage cities). The server still renders the shell as real HTML.

const emptySubscribe = () => () => {};

// false during SSR and hydration, true right after
function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export default function Home() {
  const cities = useCities();
  const unit = useUnit();
  const hydrated = useHydrated();
  const [announcement, setAnnouncement] = useState("");

  const showEmpty = hydrated && cities.length === 0;

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
        <UnitToggle />
      </header>

      <CitySearch onAdd={handleAdd} />

      {/* The server (and the hydration pass) doesn't know localStorage, so it
          renders neither cards nor the empty state - showing "no cities yet"
          to a returning visitor for even a frame would be a lie. */}
      {hydrated ? (
        showEmpty ? (
          <EmptyState onAdd={handleAdd} />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cities.map((city) => (
              <li key={cityKey(city)}>
                <CityCard
                  city={city}
                  unit={unit}
                  onRemove={() => handleRemove(city)}
                />
              </li>
            ))}
          </ul>
        )
      ) : null}

      {/* announces add/remove to screen readers without moving focus */}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </main>
  );
}
