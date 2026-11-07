import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { server } from "../../../support/msw/server";
import {
  useMarkWatchedThrough,
  useUpdateEpisodeInteraction,
} from "@/features/serials/hooks/serials/use-season-episode-interactions";
import { serialKeys } from "@/features/serials/hooks/serials/query-keys";
import type { SerialDetailResponse, SerialSeasonDetailResponse } from "@/features/serials/api";

const unwatched = { watched: false, liked: false, rating: null, hasReview: false };

const seasonDetail = (): SerialSeasonDetailResponse => ({
  tmdbId: 1396,
  season: { id: 1, seasonNumber: 1, name: "Season 1", overview: null, airDate: null, posterPath: null, episodeCount: 4 },
  episodes: [1, 2, 3, 4].map((episodeNumber) => ({
    id: episodeNumber,
    seasonNumber: 1,
    episodeNumber,
    name: `Episode ${episodeNumber}`,
    overview: null,
    airDate: null,
    stillPath: null,
    runtimeMinutes: null,
    runtimeLabel: null,
    viewerInteraction: unwatched,
  })),
});

// Only the fields the counters read; the rest of the detail view is irrelevant here.
const detailView = (watchedEpisodeCount: number) =>
  ({
    series: {
      seasons: [{ seasonNumber: 1, episodeCount: 4, watchedEpisodeCount, viewerInteraction: unwatched }],
    },
    viewerTracking: {
      watchedEpisodesCount: watchedEpisodeCount,
      currentEpisode: { seasonNumber: 1, episodeNumber: watchedEpisodeCount + 1, name: "Next" },
    },
  }) as unknown as SerialDetailResponse;

const countsIn = (queryClient: QueryClient) => {
  const cached = queryClient.getQueryData<SerialDetailResponse>(serialKeys.detailView(1396, "popular"));
  return [cached?.series.seasons[0]?.watchedEpisodeCount, cached?.viewerTracking?.watchedEpisodesCount];
};

const nextUpIn = (queryClient: QueryClient) =>
  queryClient.getQueryData<SerialDetailResponse>(serialKeys.detailView(1396, "popular"))?.viewerTracking
    ?.currentEpisode;

const hold = (method: "post" | "put", path: string) => {
  let release: () => void = () => {};
  server.use(
    http[method](path, async () => {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return HttpResponse.json({ seasonNumber: 1, watchedThrough: 3, watched: true, liked: false, rating: null });
    }),
  );
  return () => release();
};

describe("useMarkWatchedThrough", () => {
  it("marks every episode up to the chosen one watched, right away", async () => {
    let requested = "";
    let release: () => void = () => {};
    server.use(
      http.post("*/api/serials/1396/seasons/1/watched-through/3", async ({ request }) => {
        requested = new URL(request.url).pathname;
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        return HttpResponse.json({ seasonNumber: 1, watchedThrough: 3 });
      }),
    );

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    queryClient.setQueryData(serialKeys.seasonDetail(1396, 1), seasonDetail());
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useMarkWatchedThrough(1396, 1), { wrapper });
    result.current.mutate(3);

    await waitFor(() => {
      const cached = queryClient.getQueryData<SerialSeasonDetailResponse>(serialKeys.seasonDetail(1396, 1));
      expect(cached?.episodes.map((episode) => episode.viewerInteraction?.watched)).toEqual([true, true, true, false]);
    });

    release();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(requested).toBe("/api/serials/1396/seasons/1/watched-through/3");
  });
});

describe("season and series counters", () => {
  const setup = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    queryClient.setQueryData(serialKeys.seasonDetail(1396, 1), seasonDetail());
    queryClient.setQueryData(serialKeys.detailView(1396, "popular"), detailView(0));
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return { queryClient, wrapper };
  };

  it("count the episodes marked up to here before the server answers", async () => {
    const release = hold("post", "*/api/serials/1396/seasons/1/watched-through/3");
    const { queryClient, wrapper } = setup();
    const { result } = renderHook(() => useMarkWatchedThrough(1396, 1), { wrapper });

    result.current.mutate(3);
    await waitFor(() => expect(countsIn(queryClient)).toEqual([3, 3]));
    expect(nextUpIn(queryClient)).toMatchObject({ seasonNumber: 1, episodeNumber: 4, name: "Episode 4" });
    release();
  });

  it("count a single ticked episode before the server answers", async () => {
    const release = hold("put", "*/api/serials/1396/seasons/1/episodes/2/interaction");
    const { queryClient, wrapper } = setup();
    const { result } = renderHook(() => useUpdateEpisodeInteraction(1396, 1), { wrapper });

    result.current.mutate({ episodeNumber: 2, input: { watched: true } });
    await waitFor(() => expect(countsIn(queryClient)).toEqual([1, 1]));
    // Episode 1 is still unwatched, so it stays next up.
    expect(nextUpIn(queryClient)).toMatchObject({ seasonNumber: 1, episodeNumber: 1 });
    release();
  });
});
