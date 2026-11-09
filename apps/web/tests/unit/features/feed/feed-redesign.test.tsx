import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../../support/msw/server";
import { QueryClient } from "@tanstack/react-query";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { episodesSummary, toFeedDays } from "@/features/feed/components/feed-days";
import { FeedTitleCard } from "@/features/feed/components/FeedTitleCard";
import { FeedDayList } from "@/features/feed/components/FeedDayList";
import { FeedFilterSentence } from "@/features/feed/components/FeedFilterSentence";
import type { FeedRow, FeedTitleGroup } from "@/features/feed/types";

const actor = { id: "u1", username: "glory42", displayUsername: null, avatarUrl: null };

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
  log: null,
  engagement: { likeCount: 0, commentCount: 0, viewerHasLiked: false },
  itemIds: ["a1", "a2"],
  ...overrides,
});

const episode = (id: string, episodeNumber: number | null, overrides: Partial<FeedTitleGroup> = {}) =>
  group({
    id,
    movie: { tmdbId: 46648, title: "True Detective", posterPath: null, releaseYear: 2014, mediaType: "tv" },
    seasonNumber: 1,
    episodeNumber,
    watched: false,
    rating: null,
    liked: true,
    review: null,
    ...overrides,
  });

const titleRow = (titleGroup: FeedTitleGroup, day = "2026-11-02"): FeedRow => ({ kind: "title", key: titleGroup.id, day, group: titleGroup });

describe("toFeedDays", () => {
  it("splits rows into the API's days, labelled like a slate", () => {
    const days = toFeedDays([
      titleRow(group()),
      titleRow(group({ id: "a2" })),
      titleRow(group({ id: "b1" }), "2026-10-30"),
    ]);
    expect(days.map((day) => [day.key, day.label, day.week, day.rows.length])).toEqual([
      ["2026-11-02", "MON · NOV 2", "WK 45", 2],
      ["2026-10-30", "FRI · OCT 30", "WK 44", 1],
    ]);
  });

  it("goes by the row's day, not the browser's reading of its time", () => {
    // 23:30 UTC on Nov 1 is already Nov 2 for a viewer in Istanbul.
    const [day] = toFeedDays([titleRow(group({ createdAt: "2026-11-01T23:30:00Z" }))]);
    expect(day!.label).toBe("MON · NOV 2");
  });

  it("sums up a show's folded episodes", () => {
    const groups = [episode("e1", 1, { rating: 9 }), episode("e2", 2), episode("s1", null)];
    expect(episodesSummary(groups)).toBe("rated and liked 3 seasons and episodes");
  });
});

describe("folded feed rows", () => {
  it("reads a show's episodes as one card and runs of follows and likes as one line each", async () => {
    const days = toFeedDays([
      { kind: "episodes", key: "e1+e2", day: "2026-11-02", actor, movie: episode("e1", 1).movie, groups: [episode("e1", 1, { rating: 9 }), episode("e2", 2)] },
      { kind: "follows", key: "f1+f2", day: "2026-11-02", actor, usernames: ["reel_drifter", "nightowl"] },
      {
        kind: "titles",
        key: "l1+l2",
        day: "2026-11-02",
        action: "liked",
        actor,
        titles: [group().movie, { ...group().movie, tmdbId: 2, title: "Bleach" }],
      },
    ]);
    renderWithProviders(<FeedDayList isLoading={false} isError={false} days={days} />);

    expect(await screen.findByText("rated and liked 2 episodes")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /True Detective/ })).toHaveAttribute("href", "/serials/46648");
    expect(screen.getByText("S01E01")).toBeInTheDocument();
    expect(screen.getByText("9/10")).toBeInTheDocument();
    expect(screen.getByText("followed 2 people")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "@nightowl" })).toHaveAttribute("href", "/profile/nightowl");
    expect(screen.getByText("liked 2 titles")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Clayface" })).toHaveAttribute("href", "/movies/1");
    expect(screen.getByRole("link", { name: "Bleach" })).toHaveAttribute("href", "/movies/2");
  });

  it("names what fits on the line, then expands to every title and back", async () => {
    // jsdom has no layout: put every name after the second on a line of its own.
    vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(function (this: HTMLElement) {
      const index = this.parentElement ? Array.from(this.parentElement.children).indexOf(this) : 0;
      return this.tagName === "LI" && index >= 2 ? 20 : 0;
    });
    const titles = ["Clayface", "Bleach", "The Pianist", "Severance"].map((title, index) => ({
      ...group().movie,
      tmdbId: index + 1,
      title,
      mediaType: index === 3 ? ("tv" as const) : ("movie" as const),
    }));
    const days = toFeedDays([{ kind: "titles", key: "l1+l4", day: "2026-11-02", action: "liked", actor, titles }]);
    const user = userEvent.setup();
    renderWithProviders(<FeedDayList isLoading={false} isError={false} days={days} />);

    const more = await screen.findByRole("button", { name: "+2 more" });
    expect(more).toHaveAttribute("aria-expanded", "false");
    await user.click(more);

    const less = screen.getByRole("button", { name: "Show less" });
    expect(less).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Severance" })).toHaveAttribute("href", "/serials/4");
    expect(screen.getAllByTitle("Severance")[0]).toHaveAttribute("href", "/serials/4");
    await user.click(less);
    expect(screen.getByRole("button", { name: "+2 more" })).toBeInTheDocument();
  });
});

describe("FeedTitleCard", () => {
  it("reads as one watch: who, when, the title, the score, the like and the review", async () => {
    renderWithProviders(<FeedTitleCard day="2026-11-02" group={group()} />);

    expect(await screen.findByText("glory42")).toBeInTheDocument();
    expect(screen.getByText("watched")).toBeInTheDocument();
    expect(screen.getByText("21:40")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Clayface/ })).toHaveAttribute("href", "/movies/1");
    expect(screen.getByText("8/10")).toBeInTheDocument();
    expect(screen.getByLabelText("Liked")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "“Dc character when someone is not happly married”" })).toHaveAttribute("href", "/reviews/glory42/r1");
    expect(screen.getByRole("link", { name: "Reply" })).toHaveAttribute("href", "/reviews/glory42/r1");
  });

  it("says rewatched, and names the episode for TV", async () => {
    renderWithProviders(
      <FeedTitleCard
        day="2026-11-02"
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

  it("says when it was watched if that was before the day it was logged", async () => {
    const log = { id: "e1", watchedDate: "2026-10-26", rating: 8, rewatch: false };
    const { unmount } = renderWithProviders(<FeedTitleCard day="2026-11-02" group={group({ log })} />);
    expect(await screen.findByText("Watched OCT 26")).toBeInTheDocument();
    unmount();

    renderWithProviders(<FeedTitleCard day="2026-11-02" group={group({ log: { ...log, watchedDate: "2026-11-02" } })} />);
    await screen.findByText("glory42");
    expect(screen.queryByText(/^Watched/)).not.toBeInTheDocument();
  });

  it("opens the review from anywhere on the card, but leaves its links alone", async () => {
    const user = userEvent.setup();
    const { router } = renderWithProviders(<FeedTitleCard day="2026-11-02" group={group()} />);

    await user.click(await screen.findByText("8/10"));
    await vi.waitFor(() => expect(router.state.location.pathname).toBe("/reviews/glory42/r1"));
  });

  it("opens the title when the card has no review", async () => {
    const user = userEvent.setup();
    const { router } = renderWithProviders(<FeedTitleCard day="2026-11-02" group={group({ review: null })} />);

    await user.click(await screen.findByText("8/10"));
    await vi.waitFor(() => expect(router.state.location.pathname).toBe("/movies/1"));
  });

  it("hides a spoiler review behind a reveal", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FeedTitleCard day="2026-11-02" group={group({ review: { id: "r1", content: "Snape kills Dumbledore", containsSpoilers: true, rating: 8 } })} />,
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
    const { unmount } = renderWithProviders(<FeedTitleCard day="2026-11-02" group={mine} />, { queryClient: signedIn() });

    await user.click(await screen.findByRole("button", { name: "Edit" }));
    expect(await screen.findByText("EDIT REVIEW")).toBeInTheDocument();
    unmount();

    renderWithProviders(<FeedTitleCard day="2026-11-02" group={group()} />, { queryClient: signedIn() });
    await screen.findByText("glory42");
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
  });

  it("edits the whole log, review included, when the card has one", async () => {
    server.use(
      http.get("*/api/interactions/:tmdbId", () =>
        HttpResponse.json({ liked: false, watchlisted: false, rating: 8, watched: true }),
      ),
      http.get("*/api/serials/:tmdbId/interaction", () =>
        HttpResponse.json({ liked: false, watchlisted: false, rating: 8, watched: true }),
      ),
    );
    const user = userEvent.setup();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(authKeys.me, { id: "user_1", username: "cinefan" });
    const mine = group({
      actor: { id: "user_1", username: "cinefan", displayUsername: null, avatarUrl: null },
      log: { id: "e1", watchedDate: "2026-10-26", rating: 8, rewatch: false },
    });
    renderWithProviders(<FeedTitleCard day="2026-11-02" group={mine} />, { queryClient });

    await user.click(await screen.findByRole("button", { name: "Edit" }));
    expect(await screen.findByRole("dialog", { name: /^Edit log/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /First watch/ })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("textbox", { name: "Review" })).toHaveValue(
      "Dc character when someone is not happly married",
    );
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
