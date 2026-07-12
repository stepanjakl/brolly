import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { City } from "@/lib/types";
import CitySearch from "./CitySearch";

const newcastle: City = {
  name: "Newcastle upon Tyne",
  country: "GB",
  lat: 54.9783,
  lon: -1.6178,
};
const results: City[] = [
  newcastle,
  {
    name: "Newcastle",
    country: "AU",
    state: "New South Wales",
    lat: -32.9283,
    lon: 151.7817,
  },
];

function mockGeocode(body: unknown, status = 200) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

describe("CitySearch", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("searches for cities and adds the chosen one", async () => {
    mockGeocode(results);
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<CitySearch onAdd={onAdd} />);

    await user.type(screen.getByRole("combobox"), "newcastle");
    await user.click(
      await screen.findByRole("option", { name: /Newcastle upon Tyne/ }),
    );

    expect(onAdd).toHaveBeenCalledWith(newcastle);
    // The box clears, ready for the next search.
    expect(screen.getByRole("combobox")).toHaveValue("");
  });

  it("disables cities that are already on the dashboard", async () => {
    window.localStorage.setItem(
      "brolly:v1:cities",
      JSON.stringify([newcastle]),
    );
    mockGeocode(results);
    const user = userEvent.setup();
    render(<CitySearch onAdd={vi.fn()} />);

    await user.type(screen.getByRole("combobox"), "newcastle");

    const option = await screen.findByRole("option", {
      name: /Newcastle upon Tyne/,
    });
    expect(option).toHaveAttribute("aria-disabled", "true");
    expect(option).toHaveTextContent("added");
  });

  it("shows a friendly message when the search fails", async () => {
    mockGeocode({ error: "City search is unavailable" }, 502);
    const user = userEvent.setup();
    render(<CitySearch onAdd={vi.fn()} />);

    await user.type(screen.getByRole("combobox"), "newcastle");

    expect(
      await screen.findByText(/City search is unavailable/),
    ).toBeInTheDocument();
  });
});
