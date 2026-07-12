"use client";

import { ToggleButton, ToggleButtonGroup } from "react-aria-components";
import { setUnit, useUnit } from "@/hooks/useUnit";
import type { Unit } from "@/lib/units";

/** °C/°F switch. The choice persists and never refetches - temperatures are
 * converted at render time from the metric data we already have. */
export default function UnitToggle() {
  const unit = useUnit();

  return (
    <ToggleButtonGroup
      aria-label="Temperature unit"
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[unit]}
      onSelectionChange={(keys) => setUnit([...keys][0] as Unit)}
      className="flex gap-x-0.5 rounded-full bg-slate-200 p-1"
    >
      {(["c", "f"] as const).map((id) => (
        <ToggleButton
          key={id}
          id={id}
          className="cursor-pointer rounded-full px-3 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-600 selected:bg-white selected:text-slate-800"
        >
          °{id.toUpperCase()}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
