import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { UpNextPage } from "@/features/tv/components/up-next/UpNextPage";
import { UpNextStrip } from "@/features/tv/components/up-next/UpNextStrip";
import { UpNextButton } from "@/features/tv/components/up-next/UpNextButton";
import type { UpNextItem, UpNextResponse } from "@/features/tv/api";

const series = { tmdbId: 1396, title: "Breaking Bad", posterPath: null, backdropPath: null };

const item = (episodeNumber: number, overrides: Partial<UpNextItem> = {}): UpNextItem => ({
  series,
  episode: {
    seasonNumber: 2,
    episodeNumber,
    name: `Episode title ${episodeNumber}`,
    stillPath: null,
    airDate: "2009-03-08",
    runtime: 47,
  },
  seasonEpisodeCount: 13,
  watchedEpisodesCount: 7 + episodeNumber,
  numberOfEpisodes: 62,
  lastWatchedAt: "2026-11-15T20:00:00.000Z",
  newEpisodesCount: 0,
  ...overrides,
});

const response = (overrides: Partial<UpNextResponse> = {}): UpNextResponse => ({
  today: "2026-11-16",
  upNext: [],
  airingSoon: [],
  ...overrides,
});

describe("UpNextPage", () => {
  it("marks the next episode watched and advances the card to the following one", async () => {
    const user = userEvent.setup();
    const puts: { path: string; body: unknown }[] = [];
    let watched = false;
    server.use(
      http.get("*/api/serials/up-next", ({ request }) => {
        expect(new URL(request.url).searchParams.get("tz")).toBeTruthy();
        return HttpResponse.json(response({ upNext: [item(watched ? 5 : 4)] }));
      }),
      http.put("*/api/serials/1396/seasons/2/episodes/:episode/interaction", async ({ request, params }) => {
        puts.push({ path: String(params.episode), body: await request.json() });
        watched = true;
        return HttpResponse.json({ watched: true, liked: false, rating: null });
      }),
    );

    renderWithProviders(<UpNextPage />);

    expect(await screen.findByText("Episode title 4")).toBeInTheDocument();
    expect(screen.getByText("11/62 ep")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mark Breaking Bad S02E04 watched" }));

    expect(await screen.findByText("Episode title 5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark Breaking Bad S02E05 watched" })).toBeEnabled();
    expect(puts).toEqual([{ path: "4", body: { watched: true } }]);
  });

  it("puts shows with new episodes first and groups what airs soon by day", async () => {
    server.use(
      http.get("*/api/serials/up-next", () =>
        HttpResponse.json(
          response({
            upNext: [
              item(4),
              item(1, { series: { ...series, tmdbId: 7, title: "Severance" }, newEpisodesCount: 3 }),
            ],
            airingSoon: [
              {
                date: "2026-11-16",
                episodes: [{ series: { ...series, tmdbId: 8, title: "Slow Horses" }, episode: item(6).episode, source: "watching" }],
              },
              {
                date: "2026-11-17",
                episodes: [{ series: { ...series, tmdbId: 9, title: "Andor" }, episode: item(1).episode, source: "watchlist" }],
              },
            ],
          }),
        ),
      ),
    );

    renderWithProviders(<UpNextPage />);

    const fresh = await screen.findByRole("region", { name: "New since you last watched" });
    expect(screen.getByText("2 shows in progress · 2 episodes in the next 14 days")).toBeInTheDocument();
    expect(within(fresh).getByText("Severance")).toBeInTheDocument();
    expect(within(fresh).getByText("3 new")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Continue watching" })).getByText("Breaking Bad")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Today" })).getByText("Slow Horses")).toBeInTheDocument();
    const tomorrow = screen.getByRole("region", { name: "Tomorrow" });
    expect(within(tomorrow).getByText("Andor")).toBeInTheDocument();
    expect(within(tomorrow).getByText("Watchlist")).toBeInTheDocument();
  });

  it("says when there's nothing up next and nothing airing soon", async () => {
    server.use(http.get("*/api/serials/up-next", () => HttpResponse.json(response())));

    renderWithProviders(<UpNextPage />);

    expect(await screen.findByText("Nothing up next")).toBeInTheDocument();
    expect(screen.getByText("Nothing airing soon")).toBeInTheDocument();
  });
});

describe("UpNextStrip", () => {
  it("shows a few cards with a link to the full page", async () => {
    server.use(http.get("*/api/serials/up-next", () => HttpResponse.json(response({ upNext: [item(4)] }))));

    renderWithProviders(<UpNextStrip enabled />);

    expect(await screen.findByText("Episode title 4")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See all →" })).toHaveAttribute("href", "/serials/up-next");
  });

  it("lays one or two shows out as wide rows, more as swipeable cards", async () => {
    const show = (tmdbId: number) => item(4, { series: { ...series, tmdbId, title: `Show ${tmdbId}` } });
    server.use(http.get("*/api/serials/up-next", () => HttpResponse.json(response({ upNext: [show(1), show(2)] }))));
    const rows = renderWithProviders(<UpNextStrip enabled />);
    // Rows have room for the progress line; the compact cards drop it.
    expect(await screen.findAllByText("11/62 ep")).toHaveLength(2);
    rows.unmount();

    server.use(http.get("*/api/serials/up-next", () => HttpResponse.json(response({ upNext: [show(1), show(2), show(3)] }))));
    renderWithProviders(<UpNextStrip enabled />);
    expect(await screen.findByText("Show 3")).toBeInTheDocument();
    expect(screen.queryByText("11/62 ep")).toBeNull();
  });

  it("renders nothing when there's nothing up next", async () => {
    let fetched = false;
    server.use(
      http.get("*/api/serials/up-next", () => {
        fetched = true;
        return HttpResponse.json(response());
      }),
    );

    const { container } = renderWithProviders(<UpNextStrip enabled />);

    await waitFor(() => expect(fetched).toBe(true));
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});

describe("UpNextButton", () => {
  it("links to Up next with how many shows are waiting", async () => {
    server.use(http.get("*/api/serials/up-next", () => HttpResponse.json(response({ upNext: [item(4)] }))));

    renderWithProviders(<UpNextButton />);

    expect(await screen.findByRole("link", { name: "Up next: 1 show waiting" })).toHaveAttribute("href", "/serials/up-next");
  });
});
