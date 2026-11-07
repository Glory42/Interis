import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SeasonHeaderRow } from "@/features/serials/components/serial-detail/SeasonHeaderRow";
import { EpisodeRow } from "@/features/serials/components/serial-detail/EpisodeRow";
import { SeasonsHeading } from "@/features/serials/components/serial-detail/SeasonsHeading";

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

const seasonHandlers = () => ({
  onToggle: vi.fn(),
  onToggleWatched: vi.fn(),
  onToggleLiked: vi.fn(),
  onRatingChange: vi.fn(),
  onOpenReview: vi.fn(),
});

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

const episodeHandlers = () => ({
  onToggleWatched: vi.fn(),
  onToggleLiked: vi.fn(),
  onRatingChange: vi.fn(),
  onOpenReview: vi.fn(),
  onMarkWatchedThrough: vi.fn(),
});

describe("SeasonHeaderRow", () => {
  it("shows the season number, size, year and progress", () => {
    render(<SeasonHeaderRow season={season} isOpen={false} showInteractions {...seasonHandlers()} />);
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("7 EP · 2008")).toBeInTheDocument();
    expect(screen.getByText("3/7")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "3 of 7 episodes watched" })).toBeInTheDocument();
  });

  it("expands from its own button", async () => {
    const user = userEvent.setup();
    const handlers = seasonHandlers();
    render(<SeasonHeaderRow season={season} isOpen={false} showInteractions {...handlers} />);

    const expand = screen.getByRole("button", { name: /Season 1/ });
    expect(expand).toHaveAttribute("aria-expanded", "false");
    await user.click(expand);
    expect(handlers.onToggle).toHaveBeenCalledTimes(1);
  });

  it("marks the whole season watched", async () => {
    const user = userEvent.setup();
    const handlers = seasonHandlers();
    render(<SeasonHeaderRow season={season} isOpen={false} showInteractions {...handlers} />);

    const tick = screen.getByRole("button", { name: "Season watched" });
    expect(tick).toHaveAttribute("aria-pressed", "false");
    await user.click(tick);
    expect(handlers.onToggleWatched).toHaveBeenCalledTimes(1);
    expect(handlers.onToggle).not.toHaveBeenCalled();
  });

  it("hides your controls from guests", () => {
    render(<SeasonHeaderRow season={season} isOpen={false} showInteractions={false} {...seasonHandlers()} />);
    expect(screen.queryByRole("button", { name: "Season watched" })).not.toBeInTheDocument();
  });
});

describe("EpisodeRow", () => {
  it("reads like a call sheet: code, title, runtime and air date", () => {
    render(<EpisodeRow episode={episode} showInteractions {...episodeHandlers()} />);
    expect(screen.getByText("E04")).toBeInTheDocument();
    expect(screen.getByText("Cancer Man")).toBeInTheDocument();
    expect(screen.getByText(/48m · Feb 10, 2008/)).toBeInTheDocument();
  });

  it("ticks the episode watched", async () => {
    const user = userEvent.setup();
    const handlers = episodeHandlers();
    render(<EpisodeRow episode={episode} showInteractions {...handlers} />);

    const tick = screen.getByRole("button", { name: "Watched" });
    expect(tick).toHaveAttribute("aria-pressed", "false");
    await user.click(tick);
    expect(handlers.onToggleWatched).toHaveBeenCalledWith(4, false);
  });

  it("marks every episode up to an unwatched one", async () => {
    const user = userEvent.setup();
    const handlers = episodeHandlers();
    render(<EpisodeRow episode={episode} showInteractions {...handlers} />);

    await user.click(screen.getByRole("button", { name: "Mark up to here" }));
    expect(handlers.onMarkWatchedThrough).toHaveBeenCalledWith(4);
  });

  it("doesn't offer mark up to here once the episode is watched", () => {
    const watched = { ...episode, viewerInteraction: { ...episode.viewerInteraction, watched: true } };
    render(<EpisodeRow episode={watched} showInteractions {...episodeHandlers()} />);
    expect(screen.queryByRole("button", { name: "Mark up to here" })).not.toBeInTheDocument();
  });

  it("opens the description on click", async () => {
    const user = userEvent.setup();
    render(<EpisodeRow episode={episode} showInteractions {...episodeHandlers()} />);

    expect(screen.queryByText("Walt tells the family he has cancer.")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Cancer Man/ }));
    expect(screen.getByText("Walt tells the family he has cancer.")).toBeInTheDocument();
  });
});

describe("SeasonsHeading", () => {
  it("counts episodes and points at the next one", () => {
    render(<SeasonsHeading watchedEpisodes={3} totalEpisodes={62} nextUp={{ seasonNumber: 1, episodeNumber: 4 }} />);
    expect(screen.getByRole("heading", { name: "Seasons" })).toBeInTheDocument();
    expect(screen.getByText("3/62 episodes · Next up S01E04")).toBeInTheDocument();
  });

  it("says completed when nothing is left", () => {
    render(<SeasonsHeading watchedEpisodes={62} totalEpisodes={62} nextUp={null} />);
    expect(screen.getByText("62/62 episodes · Completed")).toBeInTheDocument();
  });

  it("shows only the size before you start", () => {
    render(<SeasonsHeading watchedEpisodes={0} totalEpisodes={62} nextUp={null} />);
    expect(screen.getByText("62 episodes")).toBeInTheDocument();
  });
});
