import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { FeedRail } from "@/features/feed/components/FeedRail";

const films = [
  { tmdbId: 1, title: "Resident Evil", posterPath: null, releaseYear: 2026 },
  { tmdbId: 2, title: "Heart of the Beast", posterPath: null, releaseYear: 2026 },
];
const shows = [{ tmdbId: 1396, title: "Breaking Bad", posterPath: null, firstAirYear: 2008 }];

describe("FeedRail", () => {
  it("ranks what's showing this week, films then TV", async () => {
    renderWithProviders(
      <FeedRail films={films} shows={shows} week={null} isLoading={false} now={new Date(2026, 10, 6)} />,
    );

    const nowShowing = await screen.findByRole("region", { name: "Now showing" });
    expect(within(nowShowing).getByText("Now showing · WK 45")).toBeInTheDocument();
    expect(within(nowShowing).getByRole("link", { name: /Resident Evil/ })).toHaveAttribute("href", "/movies/1");
    expect(within(nowShowing).getByText("02")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Breaking Bad/ })).toHaveAttribute("href", "/serials/1396");
  });

  it("adds up your week with real numbers", async () => {
    renderWithProviders(
      <FeedRail films={[]} shows={[]} week={{ logs: 3, averageRating: 9, episodes: 416 }} isLoading={false} />,
    );

    const week = await screen.findByRole("region", { name: "Your week" });
    expect(within(week).getByText("Logged").closest("div")).toHaveTextContent("3");
    expect(within(week).getByText("Avg rating").closest("div")).toHaveTextContent("9.0");
    expect(within(week).getByText("Episodes").closest("div")).toHaveTextContent("416");
  });

  it("says when you haven't rated anything this week", async () => {
    renderWithProviders(
      <FeedRail films={[]} shows={[]} week={{ logs: 1, averageRating: null, episodes: 0 }} isLoading={false} />,
    );

    const week = await screen.findByRole("region", { name: "Your week" });
    expect(within(week).getByText("Avg rating").closest("div")).toHaveTextContent("—");
  });
});
