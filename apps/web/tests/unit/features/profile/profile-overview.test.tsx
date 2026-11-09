import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { ProfileOverviewActivity } from "@/features/profile/components/overview/ProfileOverviewActivity";
import { ProfileTopPicksRow } from "@/features/profile/components/overview/ProfileTopPicksRow";
import type { FeedItem, FeedRow, FeedTitleGroup } from "@/features/feed/types";

const actor = { id: "u1", username: "glory42", displayUsername: null, avatarUrl: null };

const title = (overrides: Partial<FeedTitleGroup> = {}): FeedTitleGroup => ({
  kind: "title",
  id: "a1",
  createdAt: "2026-11-02T21:40:00",
  actor,
  movie: { tmdbId: 1, title: "Clayface", posterPath: null, releaseYear: 2026, mediaType: "movie" },
  seasonNumber: null,
  episodeNumber: null,
  watched: true,
  rewatch: false,
  rating: 8,
  liked: true,
  watchlisted: false,
  review: { id: "r1", content: "Dc character when someone is not happly married", containsSpoilers: false, rating: 8 },
  log: null,
  engagement: { likeCount: 0, commentCount: 0, viewerHasLiked: false },
  itemIds: ["a1"],
  ...overrides,
});

const watchlistItem = {
  id: "w1",
  type: "watchlisted_movie",
  kind: "watchlisted_movie",
  createdAt: "2026-11-04T10:00:00",
  actor,
  movie: { tmdbId: 9, title: "100 Meters", posterPath: null, releaseYear: 2025, mediaType: "movie" },
  post: null,
  review: null,
  metadata: {},
  engagement: { likeCount: 0, commentCount: 0, viewerHasLiked: null },
} as unknown as FeedItem;

describe("ProfileOverviewActivity", () => {
  it("shows one row per watch with its kicker, score, like and review", async () => {
    renderWithProviders(<ProfileOverviewActivity rows={[{ kind: "title", key: "a1", day: "2026-11-02", group: title() }]} isPending={false} isError={false} />);

    expect(await screen.findByText("MON · NOV 2")).toBeInTheDocument();
    expect(screen.getByText("Film · watched")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Clayface/ })).toHaveAttribute("href", "/movies/1");
    expect(screen.getByLabelText("8 of 10")).toBeInTheDocument();
    expect(screen.getByLabelText("Liked")).toBeInTheDocument();
    expect(screen.getByLabelText("Reviewed")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "“Dc character when someone is not happly married”" })).toHaveAttribute("href", "/reviews/glory42/r1");
  });

  it("names series and quieter events in one line", async () => {
    const rows: FeedRow[] = [
      { kind: "activity", key: "w1", day: "2026-11-04", item: watchlistItem },
      {
        kind: "title",
        key: "b1",
        day: "2026-11-02",
        group: title({
          id: "b1",
          review: null,
          liked: false,
          movie: { tmdbId: 1396, title: "Breaking Bad", posterPath: null, releaseYear: 2008, mediaType: "tv" },
        }),
      },
    ];
    renderWithProviders(<ProfileOverviewActivity rows={rows} isPending={false} isError={false} />);

    expect(await screen.findByText("Added to watchlist")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "100 Meters" })).toHaveAttribute("href", "/movies/9");
    expect(screen.getByText("Series · watched")).toBeInTheDocument();
  });

  it("shows a folded run of likes or follows as one line", async () => {
    const rows: FeedRow[] = [
      { kind: "titles", key: "l1+l2", day: "2026-11-02", action: "liked", actor, titles: [title().movie, { ...title().movie, tmdbId: 2, title: "Bleach" }] },
      { kind: "follows", key: "f1+f2", day: "2026-11-02", actor, usernames: ["reel_drifter", "nightowl"] },
    ];
    renderWithProviders(<ProfileOverviewActivity rows={rows} isPending={false} isError={false} />);

    expect(await screen.findByRole("link", { name: "Bleach" })).toHaveAttribute("href", "/movies/2");
    expect(screen.getByRole("link", { name: "@nightowl" })).toHaveAttribute("href", "/profile/nightowl");
    expect(screen.getByText("Followed 2 people ·")).toBeInTheDocument();
  });
});

describe("ProfileTopPicksRow", () => {
  const empty = { key: "movie", supported: true, items: [] } as never;

  it("hides empty favourites from visitors", async () => {
    const { container } = renderWithProviders(
      <ProfileTopPicksRow categoryKey="movie" category={empty} isPending={false} isError={false} isOwner={false} />,
    );
    await screen.findByText((_, element) => element === container || container.contains(element));
    expect(container).not.toHaveTextContent("Not set");
    expect(container).not.toHaveTextContent("Favourite films");
  });

  it("invites the owner to pick some", async () => {
    renderWithProviders(
      <ProfileTopPicksRow categoryKey="movie" category={empty} isPending={false} isError={false} isOwner />,
    );
    expect(await screen.findByRole("link", { name: /Choose your favourite films/ })).toHaveAttribute(
      "href",
      "/settings/favorites",
    );
  });
});
