"use client";

import SearchIcon from "@material-symbols/svg-700/rounded/search.svg";
import Check from "@material-symbols/svg-700/rounded/check.svg";
import {
  ComboBox,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
} from "react-aria-components";
import { useAsyncList } from "react-stately";
import { useCities } from "@/hooks/useCities";
import { cityKey } from "@/lib/cityKey";
import type { City } from "@/lib/types";

/**
 * City search: a React Aria ComboBox over /api/geocode.
 *
 * useAsyncList hands each load an AbortSignal and ignores stale results,
 * which solves the async-search race (a slow "lon" response overwriting fast
 * "london") without manual bookkeeping. The 300ms pause doubles as a
 * debounce: an aborted keystroke never reaches the network.
 */
export default function CitySearch({ onAdd }: { onAdd: (city: City) => void }) {
  const cities = useCities();
  const added = new Set(cities.map(cityKey));

  const list = useAsyncList<City>({
    async load({ filterText, signal }) {
      const query = filterText?.trim() ?? "";
      if (query.length < 2) return { items: [] };

      await new Promise((resolve) => setTimeout(resolve, 300));
      if (signal.aborted) return { items: [] };

      const response = await fetch(
        `/api/geocode?q=${encodeURIComponent(query)}`,
        { signal },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "City search failed");
      }
      return { items: (await response.json()) as City[] };
    },
  });

  const emptyStateMessage =
    (list.filterText?.trim().length ?? 0) < 2
      ? "Keep typing to search…"
      : list.loadingState === "loading" || list.loadingState === "filtering"
        ? "Searching…"
        : list.error
          ? "City search is unavailable - try again in a moment"
          : "No cities match that name";

  return (
    <ComboBox
      items={list.items}
      inputValue={list.filterText}
      onInputChange={list.setFilterText}
      // always null: this box fires actions (add a city), it doesn't hold a value
      selectedKey={null}
      onSelectionChange={(key) => {
        const city = list.items.find((item) => cityKey(item) === key);
        if (city) {
          onAdd(city);
          list.setFilterText("");
        }
      }}
      allowsEmptyCollection
      // while open, the input lifts above the popover's page dim - see the
      // z-layer ladder in globals.css
      className="relative w-full open:z-(--z-search-input) md:mx-auto md:max-w-lg"
    >
      <Label className="sr-only">Add a city to the dashboard</Label>
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 fill-slate-400"
      />
      <Input
        placeholder="Add a city…"
        // text-base (16px), not text-sm: iOS auto-zooms inputs below 16px
        className="w-full rounded-full bg-white py-2.5 pr-4 pl-11 text-base font-semibold text-slate-800 placeholder-slate-400 ring-2 ring-slate-300 transition focus:placeholder-slate-300 focus:ring-slate-400 focus:outline-none"
      />
      {/* React Aria pins popovers at an inline z-index of 100000, which would
          drag the page dim above the input too - the inline style override
          slots the popover into the ladder from globals.css */}
      <Popover
        style={{ zIndex: "var(--z-search-popover)" }}
        className="w-(--trigger-width) entering:animate-fade-in"
      >
        {/* page dim behind the results; pointer-events-none keeps every click
            (dismissal included) working - purely decorative */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-10 animate-fade-in bg-slate-900/15"
        />
        <div className="relative z-20 mx-6 rounded-xl bg-white p-2">
          <ListBox<City>
            renderEmptyState={() => (
              <p className="px-3.5 py-2.5 text-sm font-medium text-slate-500">
                {emptyStateMessage}
              </p>
            )}
          >
            {(city) => {
              const alreadyAdded = added.has(cityKey(city));
              return (
                <ListBoxItem
                  id={cityKey(city)}
                  textValue={`${city.name}, ${city.country}`}
                  isDisabled={alreadyAdded}
                  className="focused:bg-slate-100 group flex cursor-pointer items-baseline justify-between gap-3 rounded-md px-3.5 py-2.5 text-sm text-slate-800 outline-none hover:bg-slate-200 disabled:cursor-default disabled:text-slate-400 disabled:hover:bg-transparent"
                >
                  <span>
                    <span className="font-semibold">{city.name}</span>
                    {/* the disabled state lives on the ListBoxItem, so the span
                        listens via group-disabled */}
                    <span className="font-medium text-slate-500 group-disabled:text-slate-400">
                      {city.state ? ` · ${city.state}` : ""} · {city.country}
                    </span>
                  </span>
                  {/* self-center: the SVG has no text baseline to align by */}
                  {alreadyAdded ? (
                    <span className="flex items-center gap-0.5 self-center text-xs font-medium text-slate-500">
                      <Check aria-hidden className="size-3.5 fill-current" />
                      added
                    </span>
                  ) : null}
                </ListBoxItem>
              );
            }}
          </ListBox>
        </div>
      </Popover>
    </ComboBox>
  );
}
