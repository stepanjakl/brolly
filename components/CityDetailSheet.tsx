"use client";

import CollapseIcon from "@material-symbols/svg-700/rounded/collapse_content.svg";
import { useState } from "react";
import {
  Button,
  Dialog,
  Heading,
  Modal,
  ModalOverlay,
} from "react-aria-components";
import TitledButton from "@/components/TitledButton";
import { useMinPending } from "@/hooks/useMinPending";
import { useNow } from "@/hooks/useNow";
import { useWeather } from "@/hooks/useWeather";
import type { City, Weather } from "@/lib/types";
import {
  formatLocalTime,
  formatTemp,
  formatWind,
  type Unit,
} from "@/lib/units";
import { INK_CLASSES, lookFor, WELL_CLASSES } from "@/lib/weather";

type Props = {
  city: City | null;
  unit: Unit;
  onClose: () => void;
  onRemove: (city: City) => void;
};

/**
 * City detail: a bottom sheet on mobile, a right-hand drawer from sm: up -
 * one component, two presentations, driven purely by CSS. Enter/exit are
 * plain CSS animations on React Aria's data-entering/data-exiting attributes.
 */
export default function CityDetailSheet({
  city,
  unit,
  onClose,
  onRemove,
}: Props) {
  // keep the last non-null city so content stays visible through the exit
  // animation (state adjusted during render - an effect would lag a frame)
  const [renderedCity, setRenderedCity] = useState(city);
  if (city && city !== renderedCity) {
    setRenderedCity(city);
  }

  return (
    <ModalOverlay
      isOpen={city !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      isDismissable
      className="fixed inset-0 z-(--z-sheet) bg-slate-900/40 entering:animate-backdrop-in exiting:animate-backdrop-out"
    >
      <Modal className="fixed inset-x-2 bottom-2 outline-none sm:inset-x-auto sm:top-2 sm:right-2 sm:bottom-2 entering:animate-sheet-in-up sm:entering:animate-sheet-in exiting:animate-sheet-out-down sm:exiting:animate-sheet-out">
        <Dialog
          aria-label={`${renderedCity?.name ?? "City"} weather details`}
          className="flex h-full flex-col items-center gap-2 outline-none sm:flex-row sm:gap-4"
        >
          {/* close control floats outside the panel as a flex sibling - above
              the bottom sheet on mobile, beside the drawer on desktop */}
          <TitledButton
            label="Close details"
            onPress={onClose}
            className="grid cursor-pointer place-items-center rounded-full bg-white px-8 py-1.5 text-slate-500 ring-2 ring-slate-900/15 transition ease-linear hover:bg-slate-700 hover:text-white hover:ring-slate-700 sm:px-1.5 sm:py-8 pressed:scale-95"
          >
            <CollapseIcon aria-hidden className="size-5 fill-current" />
          </TitledButton>
          <div className="max-h-[80dvh] w-full overflow-y-auto overscroll-contain rounded-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:h-full sm:max-h-none sm:w-96">
            {renderedCity ? (
              <SheetBody
                city={renderedCity}
                unit={unit}
                onRemove={() => onRemove(renderedCity)}
              />
            ) : null}
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

function SheetBody({
  city,
  unit,
  onRemove,
}: {
  city: City;
  unit: Unit;
  onRemove: () => void;
}) {
  // SWR dedupes with the card's request - opening the sheet costs no API call
  const { weather } = useWeather(city);
  const now = useNow();
  const loadingHeld = useMinPending(!weather);

  return (
    <div className="flex h-full flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <Heading slot="title" className="text-lg leading-tight font-semibold">
            {city.name}
          </Heading>
          <p className="text-xs font-medium text-slate-500">
            {city.state ? `${city.state} · ` : ""}
            {city.country}
            {weather
              ? ` · ${formatLocalTime(weather.timezoneOffset, now)} local`
              : ""}
          </p>
        </div>
      </header>

      {weather && !loadingHeld ? (
        <>
          <SheetHero weather={weather} unit={unit} now={now} />
          <dl className="grid grid-cols-2 gap-2">
            <Stat
              label="Feels like"
              value={formatTemp(weather.feelsLikeC, unit)}
            />
            <Stat label="Wind" value={formatWind(weather.windMs, unit)} />
            <Stat label="Humidity" value={`${weather.humidity}%`} />
            <Stat label="Pressure" value={`${weather.pressure} hPa`} />
            <Stat
              label="Sunrise"
              value={formatLocalTime(
                weather.timezoneOffset,
                weather.sunrise * 1000,
              )}
            />
            <Stat
              label="Sunset"
              value={formatLocalTime(
                weather.timezoneOffset,
                weather.sunset * 1000,
              )}
            />
          </dl>
        </>
      ) : (
        <div
          role="status"
          aria-label="Loading details"
          className="min-h-40 animate-pulse rounded-2xl bg-slate-200"
        />
      )}

      <Button
        onPress={onRemove}
        className="mt-auto cursor-pointer self-start rounded-full bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-600 hover:text-white pressed:scale-95"
      >
        Remove {city.name}
      </Button>
    </div>
  );
}

/** Mirrors the card's gradient so the transition feels continuous. */
function SheetHero({
  weather,
  unit,
  now,
}: {
  weather: Weather;
  unit: Unit;
  now: number;
}) {
  const look = lookFor(weather, now);

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-2xl p-5 ${look.gradient} ${INK_CLASSES[look.ink].text}`}
    >
      <div>
        <p className="text-6xl font-medium tracking-tight tabular-nums">
          {formatTemp(weather.tempC, unit)}
        </p>
        <p className="mt-1 text-sm font-medium capitalize">
          {weather.description}
        </p>
      </div>
      <span
        aria-hidden
        className={`size-20 shrink-0 text-6xl ${WELL_CLASSES} ${INK_CLASSES[look.ink].well}`}
      >
        {look.emoji}
      </span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-100 px-4 py-3">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
