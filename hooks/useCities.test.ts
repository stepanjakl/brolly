import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { City } from "@/lib/types";
import { addCity, removeCity, useCities } from "./useCities";

const london: City = {
  name: "London",
  country: "GB",
  lat: 51.5073,
  lon: -0.1276,
};
const tokyo: City = {
  name: "Tokyo",
  country: "JP",
  lat: 35.6828,
  lon: 139.759,
};

describe("useCities", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts empty and reflects added cities", () => {
    const { result } = renderHook(() => useCities());
    expect(result.current).toEqual([]);

    act(() => addCity(london));
    act(() => addCity(tokyo));
    expect(result.current.map((city) => city.name)).toEqual([
      "London",
      "Tokyo",
    ]);
  });

  it("dedupes the same place even with slightly different coordinates", () => {
    const { result } = renderHook(() => useCities());
    act(() => addCity(london));
    act(() => addCity({ ...london, lat: 51.5071 })); // a second geocode of the same city
    expect(result.current).toHaveLength(1);
  });

  it("removes a city", () => {
    const { result } = renderHook(() => useCities());
    act(() => addCity(london));
    act(() => addCity(tokyo));
    act(() => removeCity(london));
    expect(result.current.map((city) => city.name)).toEqual(["Tokyo"]);
  });

  it("persists under the versioned key", () => {
    renderHook(() => useCities());
    act(() => addCity(london));
    const stored = JSON.parse(
      window.localStorage.getItem("brolly:v1:cities") ?? "[]",
    );
    expect(stored[0].name).toBe("London");
  });
});
