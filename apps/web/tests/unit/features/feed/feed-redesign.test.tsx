import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { toFeedDays } from "@/features/feed/components/feed-days";
import { FeedTitleCard } from "@/features/feed/components/FeedTitleCard";
import { FeedFilterSentence } from "@/features/feed/components/FeedFilterSentence";
import type { FeedTitleGroup, GroupedFeedEntry } from "@/features/feed/types";

const actor = { id: "u1", username: "glory42", displayUsername: null, avatarUrl: null };
const otherActor = { id: "u2", username: "reel_drifter", displayUsername: null, avatarUrl: null };

const group = (overrides: Partial<FeedTitleGroup> = {}): FeedTitleGroup => ({
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
  engagement: { likeCount: 0, commentCount: 0, viewerHasLiked: false },
  itemIds: ["a1", "a2"],
  ...overrides,
});

const likeOnly = (id: string, title: string, createdAt: string, who = actor): FeedTitleGroup =>
  group({
    id,
    createdAt,
    actor: who,
    movie: { tmdbId: Number(id.slice(1)) + 100, title, posterPath: null, releaseYear: null, mediaType: "tv" },
    watched: false,
    rating: null,
    review: null,
    liked: true,
  });

describe("toFeedDays", () => {
  it("splits entries into days labelled like a slate", () => {
    const days = toFeedDays([
      group(),
      group({ id: "b1", createdAt: "2026-10-30T10:00:00" }),
    ]);
    expect(days.map((day) => [day.label, day.week])).toEqual([
      ["MON · NOV 2", "WK 45"],
      ["FRI · OCT 30", "WK 44"],
    ]);
  });

  it("collapses one person's likes on the same day into a single line", () => {
    const entries: GroupedFeedEntry[] = [
      group(),
      likeOnly("l1", "Bleach", "2026-11-02T20:00:00"),
      likeOnly("l2", "Third Star", "2026-11-02T19:00:00"),
      likeOnly("l3", "Other", "2026-11-02T18:00:00", otherActor),
    ];
    const [day] = toFeedDays(entries);

    expect(day!.rows.map((row) => row.kind)).toEqual(["title", "likes", "title"]);
    const likes = day!.rows[1];
    expect(likes).toMatchObject({ kind: "likes", actor: { username: "glory42" } });
    expect(likes!.kind === "likes" && likes.titles.map((title) => title.title)).toEqual(["Bleach", "Third Star"]);
  });

  it("keeps a single like as its own card", () => {
    const [day] = toFeedDays([likeOnly("l1", "Bleach", "2026-11-02T20:00:00")]);
    expect(day!.rows.map((row) => row.kind)).toEqual(["title"]);
  });
});

describe("FeedTitleCard", () => {
  it("reads as one watch: who, when, the title, the score, the like and the review", async () => {
    renderWithProviders(<FeedTitleCard group={group()} />);

    expect(await screen.findByText("glory42")).toBeInTheDocument();
    expect(screen.getByText("watched")).toBeInTheDocument();
    expect(screen.getByText("21:40")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Clayface/ })).toHaveAttribute("href", "/movies/1");
    expect(screen.getByText("8/10")).toBeInTheDocument();
    expect(screen.getByLabelText("Liked")).toBeInTheDocument();
    expect(screen.getByText("“Dc character when someone is not happly married”")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reply" })).toHaveAttribute("href", "/reviews/glory42/r1");
  });

  it("says rewatched, and names the episode for TV", async () => {
    renderWithProviders(
      <FeedTitleCard
        group={group({
          rewatch: true,
          seasonNumber: 1,
          episodeNumber: 4,
          movie: { tmdbId: 1396, title: "Breaking Bad", posterPath: null, releaseYear: 2008, mediaType: "tv" },
        })}
      />,
    );
    expect(await screen.findByText("rewatched")).toBeInTheDocument();
    expect(screen.getByText("S01 · E04")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Breaking Bad/ })).toHaveAttribute("href", "/serials/1396");
  });

  it("hides a spoiler review behind a reveal", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FeedTitleCard group={group({ review: { id: "r1", content: "Snape kills Dumbledore", containsSpoilers: true, rating: 8 } })} />,
    );
    expect(screen.queryByText(/Snape/)).not.toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "Show spoilers" }));
    expect(screen.getByText(/Snape kills Dumbledore/)).toBeInTheDocument();
  });
});

describe("FeedTitleCard on your own review", () => {
  it("lets you edit the review from the feed, and only yours", async () => {
    const user = userEvent.setup();
    const mine = group({ actor: { id: "user_1", username: "cinefan", displayUsername: null, avatarUrl: null } });
    const signedIn = () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      queryClient.setQueryData(authKeys.me, { id: "user_1", username: "cinefan" });
      return queryClient;
    };
    const { unmount } = renderWithProviders(<FeedTitleCard group={mine} />, { queryClient: signedIn() });

    await user.click(await screen.findByRole("button", { name: "Edit" }));
    expect(await screen.findByText("EDIT REVIEW")).toBeInTheDocument();
    unmount();

    renderWithProviders(<FeedTitleCard group={group()} />, { queryClient: signedIn() });
    await screen.findByText("glory42");
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
  });
});

describe("FeedFilterSentence", () => {
  it("reads as a sentence and switches to films", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<FeedFilterSentence filter="all" onChange={onChange} />);

    expect(container).toHaveTextContent("Showing everything from people you follow.");
    await user.click(screen.getByRole("button", { name: /everything/ }));
    await user.click(screen.getByRole("menuitemradio", { name: "Films" }));
    expect(onChange).toHaveBeenCalledWith("movie");
  });
});
