import { afterEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { RecapBanner } from "@/features/year-review/components/RecapBanner";
import { RecapEntryCard } from "@/features/year-review/components/RecapEntryCard";
import { isRecapSeason, recapYearFor, selectableYears } from "@/features/year-review/year-review-model";

describe("recap season", () => {
  it.each([
    [new Date(2026, 10, 30), false, 2026],
    [new Date(2026, 11, 1), true, 2026],
    [new Date(2026, 11, 31), true, 2026],
    [new Date(2027, 0, 15), true, 2026],
    [new Date(2027, 0, 16), false, 2027],
  ])("on %s: season %s, recap year %s", (now, inSeason, year) => {
    expect(isRecapSeason(now)).toBe(inSeason);
    expect(recapYearFor(now)).toBe(year);
  });

  it("offers years with logs plus this one, newest first", () => {
    expect(selectableYears({ year: 2023, availableYears: [2024, 2021] }, new Date(2026, 5, 1))).toEqual([2026, 2024, 2023, 2021]);
  });
});

describe("RecapBanner", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("shows from Dec 1 and stays dismissed once closed", async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithProviders(<RecapBanner userId="u1" username="glory42" now={new Date(2026, 11, 1)} />);

    expect(await screen.findByText("Your 2026 in review is ready.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /See it and share it/ })).toHaveAttribute("href", "/profile/glory42/year/2026");
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText("Your 2026 in review is ready.")).not.toBeInTheDocument();
    unmount();

    renderWithProviders(<RecapBanner userId="u1" username="glory42" now={new Date(2026, 11, 20)} />);
    expect(screen.queryByText("Your 2026 in review is ready.")).not.toBeInTheDocument();
  });

  it("points at last year in early January and hides outside the season", async () => {
    const { unmount } = renderWithProviders(<RecapBanner userId="u2" username="glory42" now={new Date(2027, 0, 10)} />);
    expect(await screen.findByText("Your 2026 in review is ready.")).toBeInTheDocument();
    unmount();

    renderWithProviders(<RecapBanner userId="u2" username="glory42" now={new Date(2027, 1, 1)} />);
    expect(screen.queryByText(/in review is ready/)).not.toBeInTheDocument();
  });
});

describe("RecapEntryCard", () => {
  it("links the owner to this year's recap", async () => {
    renderWithProviders(<RecapEntryCard username="glory42" now={new Date(2026, 10, 16)} />);
    expect(await screen.findByRole("link", { name: /Your 2026 in review/ })).toHaveAttribute("href", "/profile/glory42/year/2026");
  });
});
