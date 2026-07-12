"use client";

import CloseIcon from "@material-symbols/svg-700/rounded/close.svg";
import { Button } from "react-aria-components";
import TitledButton from "@/components/TitledButton";
import { useMinPending } from "@/hooks/useMinPending";
import { useNow } from "@/hooks/useNow";
import { useWeather } from "@/hooks/useWeather";
import type { City } from "@/lib/types";
import {
  formatFetchedAt,
  formatLocalTime,
  formatTemp,
  timeAgo,
  type Unit,
} from "@/lib/units";
import { INK_CLASSES, lookFor, WELL_CLASSES } from "@/lib/weather";

type Props = {
  city: City;
  unit: Unit;
  onOpenDetail: () => void;
  onRemove: () => void;
};

/**
 * One city's tile. Owns its own weather request, so each card carries its own
 * loading and error state - one failing city never affects its neighbours.
 */
export default function CityCard({
  city,
  unit,
  onOpenDetail,
  onRemove,
}: Props) {
  const { weather, error, isLoading, isValidating, retry } = useWeather(city);
  const now = useNow();
  // Pending states hold for a beat so fast responses don't flick the UI.
  // !error keeps the skeleton to the FIRST load - during a retry isLoading is
  // true again, but the error card must stay put with "Trying…" on the button.
  const loadingHeld = useMinPending(isLoading && !error);
  // !weather scopes this to retries - otherwise every healthy card would arm
  // a timer on each background revalidation
  const tryingHeld = useMinPending(isValidating && !weather);

  if (loadingHeld) {
    return (
      <div
        role="status"
        aria-label={`Loading weather for ${city.name}`}
        className="min-h-44 animate-pulse rounded-3xl bg-slate-300/60"
      />
    );
  }

  // data wins: if a background refresh fails, keep showing slightly stale
  // weather - the error card is only for having nothing at all
  if (!weather) {
    return (
      <div className="flex min-h-44 animate-pop-in flex-col justify-between rounded-3xl bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">{city.name}</h2>
            <p className="text-xs font-medium text-slate-500">{city.country}</p>
          </div>
          <span
            aria-hidden
            className="block size-12 rounded-full bg-slate-200"
          />
        </div>
        <div>
          <p className="text-sm text-slate-600">
            {error instanceof Error
              ? error.message
              : "Couldn't load the weather"}
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              onPress={retry}
              isDisabled={tryingHeld}
              className="cursor-pointer rounded-full bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-default disabled:opacity-60 pressed:scale-95"
            >
              {tryingHeld ? "Trying…" : "Try again"}
            </Button>
            <Button
              onPress={onRemove}
              className="cursor-pointer rounded-full bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 pressed:scale-95"
            >
              Remove
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const look = lookFor(weather, now);
  const ink = INK_CLASSES[look.ink];

  return (
    <article
      className={`group relative flex min-h-44 animate-pop-in flex-col justify-between rounded-3xl p-5 inset-ring-2 inset-ring-slate-900/5 transition-transform has-data-hovered:scale-[1.01] has-pressed:scale-[0.985] ${look.gradient} ${ink.text}`}
    >
      {/* remove button straddles the top-right corner, revealed on hover;
          removed outright on coarse pointers (no hover) - removal there lives
          in the detail sheet */}
      <TitledButton
        label={`Remove ${city.name}`}
        onPress={onRemove}
        wrapperClassName="absolute top-0 right-0 z-10 translate-x-1/3 -translate-y-1/3 opacity-0 transition-opacity group-hover:opacity-100 has-[:focus-visible]:opacity-100 pointer-coarse:hidden"
        className="grid size-7 cursor-pointer place-items-center rounded-full bg-white text-slate-500 ring-2 ring-slate-900/15 transition hover:bg-rose-400 hover:text-white hover:ring-rose-400 pressed:scale-90"
      >
        <CloseIcon aria-hidden className="size-3.5 fill-current" />
      </TitledButton>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="leading-tight font-semibold">{city.name}</h2>
          <p className={`text-xs font-medium ${ink.subtle}`}>
            {city.country} · {formatLocalTime(weather.timezoneOffset, now)}
          </p>
        </div>
        {/* tinted well keeps pale glyphs (🌫️ 🌨️ ⛅) legible on light gradients */}
        <span
          aria-hidden
          className={`size-12 text-3xl ${WELL_CLASSES} ${ink.well}`}
        >
          {look.emoji}
        </span>
      </div>

      <div>
        <p className="text-5xl font-medium tracking-tight tabular-nums">
          {formatTemp(weather.tempC, unit)}
        </p>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium capitalize">
            {weather.description}
          </p>
          {/* z-10 lifts the label above the full-card press target so the
              title tooltip can hit-test */}
          <p
            title={`Weather fetched at ${formatFetchedAt(weather.fetchedAt)}`}
            className={`relative z-10 cursor-help text-2xs font-medium ${ink.subtle}`}
          >
            updated {timeAgo(weather.fetchedAt, now)}
          </p>
        </div>
      </div>

      {/* full-card press target for the detail sheet */}
      <Button
        onPress={onOpenDetail}
        aria-label={`Weather details for ${city.name}`}
        className="absolute inset-0 cursor-pointer rounded-3xl"
      />
    </article>
  );
}
