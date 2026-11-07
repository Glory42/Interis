import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { ProfileWatchingRow } from "@/features/profile/components/ProfileWatchingRow";
import type { CurrentlyWatchingSeries } from "@/features/profile/api/schemas";

const series = (overrides: Partial<CurrentlyWatchingSeries> = {}): CurrentlyWatchingSeries => ({
  tmdbId: 209867,
  title: "Frieren",
  posterPath: null,
  backdropPath: null,
  firstAirYear: 2023,
  numberOfSeasons: 1,
  numberOfEpisodes: 28,
  watchedEpisodesCount: 21,
  progressPercent: 75,
  lastWatchedAt: "2026-11-01T20:00:00",
  currentEpisode: { seasonNumber: 1, episodeNumber: 22, name: "Episode 22" },
  ...overrides,
});

describe("ProfileWatchingRow", () => {
  it("leads with next up and shows the show as a reel", async () => {
    renderWithProviders(<ProfileWatchingRow series={series()} isOwner={false} now={new Date(2026, 10, 7)} />);

    expect(await screen.findByRole("link", { name: /Frieren/ })).toHaveAttribute("href", "/serials/209867");
    expect(screen.getByText("Next up · S01E22")).toBeInTheDocument();
    expect(screen.getByText("21/28 ep · last watched Sun Nov 1")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "21 of 28 episodes watched" })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("drops the reel when the total is unknown", async () => {
    renderWithProviders(
      <ProfileWatchingRow series={series({ numberOfEpisodes: null })} isOwner={false} now={new Date(2026, 10, 7)} />,
    );
    expect(await screen.findByText("21 episodes watched · last watched Sun Nov 1")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /episodes watched/ })).not.toBeInTheDocument();
  });

  it("lets the owner tick the next episode", async () => {
    renderWithProviders(<ProfileWatchingRow series={series()} isOwner now={new Date(2026, 10, 7)} />);
    expect(await screen.findByRole("button", { name: "Mark S01E22 watched" })).toHaveTextContent("✓ S01E22");
  });
});
