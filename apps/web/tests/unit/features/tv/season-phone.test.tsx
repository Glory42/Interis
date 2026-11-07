import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EpisodeSheet } from "@/features/tv/components/series-detail/EpisodeSheet";
import { EpisodeRow } from "@/features/tv/components/series-detail/EpisodeRow";
import { NextUpCard } from "@/features/tv/components/series-detail/NextUpCard";
import { SeasonHeaderRow } from "@/features/tv/components/series-detail/SeasonHeaderRow";

const episode = {
  id: 62085,
  seasonNumber: 1,
  episodeNumber: 4,
  name: "Cancer Man",
  overview: "Walt tells the family he has cancer.",
  airDate: "2008-02-10",
  stillPath: null,
  runtimeMinutes: 48,
  runtimeLabel: "48m",
  viewerInteraction: { watched: false, liked: false, rating: null, hasReview: false },
};

const handlers = () => ({
  onToggleWatched: vi.fn(),
  onToggleLiked: vi.fn(),
  onRatingChange: vi.fn(),
  onOpenReview: vi.fn(),
  onMarkWatchedThrough: vi.fn(),
});

describe("EpisodeSheet", () => {
  it("heads with the episode code, runtime and air date", () => {
    render(<EpisodeSheet episode={episode} onClose={vi.fn()} {...handlers()} />);
    const sheet = screen.getByRole("dialog", { name: "Cancer Man" });
    expect(within(sheet).getByText("S01 · E04 · 48m · Feb 10, 2008")).toBeInTheDocument();
    expect(within(sheet).getByRole("slider", { name: "Episode rating out of 10" })).toBeInTheDocument();
  });

  it("marks it watched, likes it, reviews it and marks up to here", async () => {
    const user = userEvent.setup();
    const actions = handlers();
    render(<EpisodeSheet episode={episode} onClose={vi.fn()} {...actions} />);

    const markWatched = screen.getByRole("button", { name: "Mark watched" });
    expect(markWatched).toHaveAttribute("aria-pressed", "false");
    await user.click(markWatched);
    await user.click(screen.getByRole("button", { name: "Like" }));
    await user.click(screen.getByRole("button", { name: "Review" }));
    await user.click(screen.getByRole("button", { name: "Up to here" }));

    expect(actions.onToggleWatched).toHaveBeenCalledWith(4, false);
    expect(actions.onToggleLiked).toHaveBeenCalledWith(4, false);
    expect(actions.onOpenReview).toHaveBeenCalledWith(4, "Cancer Man");
    expect(actions.onMarkWatchedThrough).toHaveBeenCalledWith(4);
  });
});

describe("EpisodeRow on phones", () => {
  it("opens the episode sheet from ⋯", async () => {
    const user = userEvent.setup();
    render(<EpisodeRow episode={episode} layout="phone" showInteractions {...handlers()} />);

    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "More for E04" }));
    expect(screen.getByRole("dialog", { name: "Cancer Man" })).toBeInTheDocument();
  });

  it("shows small marks for what you've set", () => {
    const rated = { ...episode, viewerInteraction: { watched: true, liked: true, rating: 7, hasReview: false } };
    render(<EpisodeRow episode={rated} layout="phone" showInteractions {...handlers()} />);
    expect(screen.getByLabelText("Liked")).toBeInTheDocument();
    expect(screen.getByLabelText("Rated 7")).toBeInTheDocument();
  });
});

describe("NextUpCard", () => {
  it("names the next episode and marks it watched", async () => {
    const user = userEvent.setup();
    const onMarkWatched = vi.fn();
    render(
      <NextUpCard
        seasonNumber={2}
        episodeNumber={29}
        seasonName="Thousand-Year Blood War"
        seasonEpisodeCount={50}
        onMarkWatched={onMarkWatched}
        isSaving={false}
      />,
    );

    expect(screen.getByText("Next up · S02 · E29")).toBeInTheDocument();
    expect(screen.getByText("Thousand-Year Blood War")).toBeInTheDocument();
    expect(screen.getByText("Episode 29 of 50")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mark watched" }));
    expect(onMarkWatched).toHaveBeenCalledTimes(1);
  });
});

describe("SeasonHeaderRow on phones", () => {
  it("keeps just the progress and opens the season", () => {
    const season = {
      id: 3572,
      seasonNumber: 1,
      name: "Season 1",
      episodeCount: 7,
      watchedEpisodeCount: 3,
      airDate: "2008-01-20",
      posterPath: null,
      viewerInteraction: { watched: false, liked: false, rating: null, hasReview: false },
    };
    render(
      <SeasonHeaderRow
        season={season}
        isOpen={false}
        compact
        showInteractions
        onToggle={vi.fn()}
        onToggleWatched={vi.fn()}
        onToggleLiked={vi.fn()}
        onRatingChange={vi.fn()}
        onOpenReview={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /Season 1/ })).toBeInTheDocument();
    expect(screen.getByText("3/7")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Season watched" })).not.toBeInTheDocument();
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });
});
