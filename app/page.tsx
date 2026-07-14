"use client";

import RefreshIcon from "@material-symbols/svg-700/rounded/refresh.svg";
import { useEffect, useState, useSyncExternalStore } from "react";
import CityCard from "@/components/CityCard";
import CityDetailSheet from "@/components/CityDetailSheet";
import CitySearch from "@/components/CitySearch";
import EmptyState from "@/components/EmptyState";
import TitledButton from "@/components/TitledButton";
import UnitToggle from "@/components/UnitToggle";
import { addCity, removeCity, useCities } from "@/hooks/useCities";
import { useMinPending } from "@/hooks/useMinPending";
import { useUnit } from "@/hooks/useUnit";
import {
  forgetWeather,
  isWeatherStale,
  refreshCity,
  useRefreshAllWeather,
} from "@/hooks/useWeather";
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
  const [detailCity, setDetailCity] = useState<City | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const refreshAllWeather = useRefreshAllWeather();
  const [refreshing, setRefreshing] = useState(false);
  // cache-hit refreshes resolve near-instantly; the held beat keeps the
  // spinner from flicking for a single frame
  const refreshingHeld = useMinPending(refreshing);

  const showEmpty = hydrated && cities.length === 0;

  // When the first city arrives, keep the empty state mounted briefly so it
  // fades out instead of vanishing. A timer, not onAnimationEnd: under
  // prefers-reduced-motion animations are disabled and the event never fires.
  // Must outlast the 150ms fade-out in globals.css.
  const [emptyLeaving, setEmptyLeaving] = useState(false);
  useEffect(() => {
    if (!emptyLeaving) return;
    const timer = setTimeout(() => setEmptyLeaving(false), 200);
    return () => clearTimeout(timer);
  }, [emptyLeaving]);

  async function refreshAll() {
    setRefreshing(true);
    try {
      await refreshAllWeather();
      setAnnouncement("Weather refreshed");
    } finally {
      setRefreshing(false);
    }
  }

  function handleAdd(city: City) {
    // adding the first city starts the empty state's exit fade
    if (cities.length === 0) setEmptyLeaving(true);
    // Re-adding a city whose data aged past the 10-min window forces a real
    // upstream refresh, so it doesn't reappear showing the old numbers.
    const stale = isWeatherStale(city);
    addCity(city);
    if (stale) void refreshCity(city);
    setAnnouncement(`${city.name} added to the dashboard`);
  }

  function handleRemove(city: City) {
    removeCity(city);
    forgetWeather(city);
    setAnnouncement(`${city.name} removed`);
    if (detailCity && cityKey(detailCity) === cityKey(city)) {
      setDetailCity(null);
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-2 p-4 sm:gap-4 sm:p-4 md:gap-6 md:p-6 lg:gap-8 lg:p-8">
      <header className="sticky top-2 z-(--z-header) flex items-center justify-between rounded-full bg-white py-2 pr-2 pl-6 sm:top-4 md:top-6 lg:top-8">
        <h1 className="text-xl font-bold">brolly</h1>
        {/* hidden by default (SSR included) - the umbrella only fades in once
            the board has cities, so it never doubles the empty state's own */}
        <span
          aria-hidden
          role="img"
          className={`text-3xl leading-none transition duration-300 ${
            hydrated && cities.length > 0 ? "" : "scale-50 opacity-0"
          }`}
        >
          ☂️
        </span>
        <UnitToggle />
      </header>

      <CitySearch onAdd={handleAdd} />

      {/* The server (and the hydration pass) doesn't know localStorage, so it
          renders neither cards nor the empty state - showing "no cities yet"
          to a returning visitor for even a frame would be a lie. */}
      {hydrated ? (
        showEmpty || emptyLeaving ? (
          /* while leaving, the empty state fades out in place at full size
             before the grid mounts - overlaying it on the much shorter card
             row would clip and squeeze it mid-fade */
          <div
            aria-hidden={emptyLeaving || undefined}
            className={`flex flex-1 flex-col ${
              emptyLeaving ? "pointer-events-none animate-fade-out" : ""
            }`}
          >
            <EmptyState onAdd={handleAdd} />
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {cities.map((city, index) => (
              <li
                key={cityKey(city)}
                className="animate-pop-in"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <CityCard
                  city={city}
                  unit={unit}
                  onOpenDetail={() => setDetailCity(city)}
                  onRemove={() => handleRemove(city)}
                />
              </li>
            ))}
          </ul>
        )
      ) : null}

      <footer className="mt-auto pt-4 text-center text-xs font-medium text-slate-500">
        weather refreshes every 10 minutes{" "}
        <TitledButton
          label="Refresh all weather now"
          onPress={refreshAll}
          isDisabled={refreshingHeld}
          className="inline-grid size-5 cursor-pointer place-items-center rounded-full bg-white align-middle transition hover:bg-slate-100 disabled:cursor-default pressed:scale-90"
        >
          <RefreshIcon
            aria-hidden
            className={`size-3.5 fill-current ${refreshingHeld ? "animate-spin" : ""}`}
          />
        </TitledButton>{" "}
        · data by{" "}
        <a
          href="https://openweathermap.org"
          className="underline decoration-slate-400 underline-offset-2 transition hover:text-slate-600 hover:decoration-slate-500"
        >
          OpenWeather
        </a>
      </footer>

      {/* announces add/remove to screen readers without moving focus */}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <CityDetailSheet
        city={detailCity}
        unit={unit}
        onClose={() => setDetailCity(null)}
        onRemove={handleRemove}
      />
    </main>
  );
}
