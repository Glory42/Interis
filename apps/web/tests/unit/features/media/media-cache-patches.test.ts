import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { interactionKeys } from "@/features/interactions/hooks/interaction-keys";
import {
  applyMediaEvent,
  type InteractionInput,
  type InteractionState,
  type MediaKind,
} from "@/features/media/media-cache";
import type { SeriesDetailResponse, SeriesSeasonDetailResponse } from "@/features/tv/api";
import { seriesKeys } from "@/features/tv/hooks/tv/query-keys";

const FILM = 550;
const SERIES = 1399;

const unwatched = { watched: false, liked: false, rating: null, hasReview: false };
const blank: InteractionState = { liked: false, watchlisted: false, rating: null, watched: false };
const watchlisted: InteractionState = { ...blank, watchlisted: true };

const interactionKey = (kind: MediaKind) =>
  kind === "film" ? interactionKeys.detail(FILM) : seriesKeys.interaction(SERIES);

const patchedInteraction = async (kind: MediaKind, previous: InteractionState, input: InteractionInput) => {
  const queryClient = new QueryClient();
  const seeded = kind === "tv" ? { ...previous, watchStatus: previous.watchStatus ?? null } : previous;
  queryClient.setQueryData(interactionKey(kind), seeded);
  await applyMediaEvent(queryClient, { type: "interaction-changed", kind, tmdbId: kind === "film" ? FILM : SERIES, input });
  return queryClient.getQueryData<InteractionState>(interactionKey(kind));
};

type Row = {
  name: string;
  previous: InteractionState;
  input: InteractionInput;
  film: Partial<InteractionState>;
  tv: Partial<InteractionState>;
};

// The client mirror of the API's Interaction state rules, for both kinds.
const rows: Row[] = [
  {
    name: "liking takes it off the Watchlist; only a Film is watched by it",
    previous: watchlisted,
    input: { liked: true },
    film: { liked: true, watchlisted: false, watched: true },
    tv: { liked: true, watchlisted: false, watched: false, watchStatus: null },
  },
  {
    name: "rating takes it off the Watchlist; only a Film is watched by it",
    previous: watchlisted,
    input: { rating: 8 },
    film: { rating: 8, watchlisted: false, watched: true },
    tv: { rating: 8, watchlisted: false, watched: false },
  },
  {
    name: "watching takes it off the Watchlist",
    previous: watchlisted,
    input: { watched: true },
    film: { watched: true, watchlisted: false },
    tv: { watched: true, watchlisted: false, watchStatus: "completed" },
  },
  {
    name: "an explicit watchlisted in the same write wins",
    previous: blank,
    input: { liked: true, watchlisted: true },
    film: { liked: true, watchlisted: true, watched: true },
    tv: { liked: true, watchlisted: true, watched: false },
  },
  {
    name: "unliking or unwatching leaves the Watchlist alone",
    previous: { ...watchlisted, liked: true, watched: true, watchStatus: "completed" },
    input: { liked: false, watched: false },
    film: { liked: false, watchlisted: true, watched: false },
    tv: { liked: false, watchlisted: true, watched: false, watchStatus: null },
  },
  {
    name: "the implicit watch wins over an explicit watched: false on a Film",
    previous: blank,
    input: { liked: true, watched: false },
    film: { liked: true, watched: true },
    tv: { liked: true, watched: false },
  },
  {
    name: "clearing a rating keeps the rest",
    previous: { ...blank, rating: 6, watched: true, watchStatus: "completed" },
    input: { rating: null },
    film: { rating: null, watched: true },
    tv: { rating: null, watched: true, watchStatus: "completed" },
  },
];

describe("media cache patch: Interaction event × media kind", () => {
  for (const row of rows) {
    for (const kind of ["film", "tv"] as const) {
      it(`${row.name} (${kind})`, async () => {
        expect(await patchedInteraction(kind, row.previous, row.input)).toMatchObject(row[kind]);
      });
    }
  }

  it("sets a Series watch status as sent", async () => {
    expect(await patchedInteraction("tv", blank, { watchStatus: "paused" })).toMatchObject({ watchStatus: "paused" });
  });

  it("leaves an uncached Interaction uncached", async () => {
    const queryClient = new QueryClient();
    await applyMediaEvent(queryClient, { type: "interaction-changed", kind: "film", tmdbId: FILM, input: { liked: true } });
    expect(queryClient.getQueryData(interactionKeys.detail(FILM))).toBeUndefined();
  });
});

const seasonDetail = (): SeriesSeasonDetailResponse =>
  ({
    episodes: [1, 2].map((episodeNumber) => ({ episodeNumber, name: `Episode ${episodeNumber}`, viewerInteraction: unwatched })),
  }) as unknown as SeriesSeasonDetailResponse;

const detailView = () =>
  ({
    series: { seasons: [{ seasonNumber: 1, episodeCount: 2, watchedEpisodeCount: 0, viewerInteraction: unwatched }] },
    viewerTracking: { watchedEpisodesCount: 0, currentEpisode: { seasonNumber: 1, episodeNumber: 1, name: "Episode 1" } },
  }) as unknown as SeriesDetailResponse;

const seriesCache = () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(seriesKeys.interaction(SERIES), { ...watchlisted, watchStatus: null });
  queryClient.setQueryData(seriesKeys.seasonDetail(SERIES, 1), seasonDetail());
  queryClient.setQueryData(seriesKeys.detailView(SERIES, "popular"), detailView());
  const read = () => {
    const view = queryClient.getQueryData<SeriesDetailResponse>(seriesKeys.detailView(SERIES, "popular"))!;
    const season = view.series.seasons[0]!;
    return {
      interaction: queryClient.getQueryData<InteractionState>(seriesKeys.interaction(SERIES)),
      episodes: queryClient
        .getQueryData<SeriesSeasonDetailResponse>(seriesKeys.seasonDetail(SERIES, 1))!
        .episodes.map((episode) => episode.viewerInteraction),
      season: season.viewerInteraction,
      counts: [season.watchedEpisodeCount, view.viewerTracking?.watchedEpisodesCount],
    };
  };
  return { queryClient, read };
};

describe("media cache patch: season and episode events", () => {
  it("a Series watched toggle cascades to its seasons and episodes", async () => {
    const { queryClient, read } = seriesCache();
    await applyMediaEvent(queryClient, { type: "interaction-changed", kind: "tv", tmdbId: SERIES, input: { watched: true } });
    const state = read();
    expect(state.interaction).toMatchObject({ watched: true, watchlisted: false, watchStatus: "completed" });
    expect(state.season?.watched).toBe(true);
    expect(state.episodes.map((episode) => episode?.watched)).toEqual([true, true]);
  });

  it("a season like touches only the season", async () => {
    const { queryClient, read } = seriesCache();
    await applyMediaEvent(queryClient, { type: "season-interaction-changed", tmdbId: SERIES, seasonNumber: 1, input: { liked: true } });
    const state = read();
    expect(state.season).toMatchObject({ liked: true, watched: false });
    expect(state.episodes.map((episode) => episode?.watched)).toEqual([false, false]);
    expect(state.counts).toEqual([0, 0]);
  });

  it("a season watched toggle ticks every episode and fills the counts", async () => {
    const { queryClient, read } = seriesCache();
    await applyMediaEvent(queryClient, { type: "season-interaction-changed", tmdbId: SERIES, seasonNumber: 1, input: { watched: true } });
    const state = read();
    expect(state.season?.watched).toBe(true);
    expect(state.episodes.map((episode) => episode?.watched)).toEqual([true, true]);
    expect(state.counts).toEqual([2, 2]);
  });

  it("rating an unwatched episode watches it implicitly", async () => {
    const { queryClient, read } = seriesCache();
    const event = { type: "episode-interaction-changed", tmdbId: SERIES, seasonNumber: 1, episodeNumber: 1, input: { rating: 7 } } as const;
    await applyMediaEvent(queryClient, event);
    const state = read();
    expect(state.episodes[0]).toMatchObject({ rating: 7, watched: true });
    expect(state.counts).toEqual([1, 1]);
    expect(state.season?.watched).toBe(false);
  });

  it("ticking the last episode completes the season", async () => {
    const { queryClient, read } = seriesCache();
    await applyMediaEvent(queryClient, { type: "episodes-watched-through", tmdbId: SERIES, seasonNumber: 1, episodeNumber: 1 });
    await applyMediaEvent(queryClient, {
      type: "episode-interaction-changed",
      tmdbId: SERIES,
      seasonNumber: 1,
      episodeNumber: 2,
      input: { watched: true },
    });
    const state = read();
    expect(state.season?.watched).toBe(true);
    expect(state.counts).toEqual([2, 2]);
  });

  it("rolls every patch back, in order, when the write fails", async () => {
    const { queryClient, read } = seriesCache();
    const before = read();
    const rollback = await applyMediaEvent(queryClient, {
      type: "season-interaction-changed",
      tmdbId: SERIES,
      seasonNumber: 1,
      input: { watched: true },
    });
    expect(read()).not.toEqual(before);
    rollback();
    expect(read()).toEqual(before);
  });
});
