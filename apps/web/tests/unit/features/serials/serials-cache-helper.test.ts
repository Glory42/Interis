import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  patchEpisodesInSeasonDetailCache,
  patchSeasonsInDetailViewCache,
} from "@/features/serials/hooks/serials-cache.helper";
import { serialKeys } from "@/features/serials/hooks/serials/query-keys";
import { restoreQueries } from "@/lib/query-optimistic";
import type {
  SerialDetailResponse,
  SerialSeasonDetailResponse,
} from "@/features/serials/api";

const viewerInteraction = { watched: false, liked: false, rating: null, hasReview: false };

const makeDetailResponse = (seasonNumbers: number[]): SerialDetailResponse =>
  ({
    series: {
      seasons: seasonNumbers.map((seasonNumber) => ({
        seasonNumber,
        viewerInteraction: { ...viewerInteraction },
      })),
    },
  }) as unknown as SerialDetailResponse;

const makeSeasonDetailResponse = (episodeNumbers: number[]): SerialSeasonDetailResponse =>
  ({
    episodes: episodeNumbers.map((episodeNumber) => ({
      episodeNumber,
      viewerInteraction: { ...viewerInteraction },
    })),
  }) as unknown as SerialSeasonDetailResponse;

describe("patchSeasonsInDetailViewCache", () => {
  it("patches only the targeted season across every cached reviewsSort variant", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(serialKeys.detailView(1, "recent"), makeDetailResponse([1, 2]));
    queryClient.setQueryData(serialKeys.detailView(1, "top"), makeDetailResponse([1, 2]));

    patchSeasonsInDetailViewCache(queryClient, 1, 1, { watched: true });

    for (const sort of ["recent", "top"] as const) {
      const data = queryClient.getQueryData(serialKeys.detailView(1, sort)) as SerialDetailResponse;
      const season1 = data.series.seasons.find((s) => s.seasonNumber === 1)!;
      const season2 = data.series.seasons.find((s) => s.seasonNumber === 2)!;
      expect(season1.viewerInteraction?.watched).toBe(true);
      expect(season2.viewerInteraction?.watched).toBe(false);
    }
  });

  it("patches every season when seasonNumber is 'all' (series-level cascade)", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(serialKeys.detailView(1, "recent"), makeDetailResponse([1, 2, 3]));

    patchSeasonsInDetailViewCache(queryClient, 1, "all", { watched: true });

    const data = queryClient.getQueryData(
      serialKeys.detailView(1, "recent"),
    ) as SerialDetailResponse;
    expect(data.series.seasons.every((s) => s.viewerInteraction?.watched === true)).toBe(true);
  });

  it("does not touch a different series' cache", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(serialKeys.detailView(1, "recent"), makeDetailResponse([1]));
    queryClient.setQueryData(serialKeys.detailView(2, "recent"), makeDetailResponse([1]));

    patchSeasonsInDetailViewCache(queryClient, 1, "all", { watched: true });

    const otherSeries = queryClient.getQueryData(
      serialKeys.detailView(2, "recent"),
    ) as SerialDetailResponse;
    expect(otherSeries.series.seasons[0]!.viewerInteraction?.watched).toBe(false);
  });

  it("only patches the fields present on the patch object, preserving the rest", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(serialKeys.detailView(1, "recent"), makeDetailResponse([1]));

    patchSeasonsInDetailViewCache(queryClient, 1, 1, { rating: 8 });

    const data = queryClient.getQueryData(
      serialKeys.detailView(1, "recent"),
    ) as SerialDetailResponse;
    const season = data.series.seasons[0]!;
    expect(season.viewerInteraction?.rating).toBe(8);
    expect(season.viewerInteraction?.watched).toBe(false);
    expect(season.viewerInteraction?.liked).toBe(false);
  });

  it("returns a snapshot that restoreQueries can use to roll back the patch", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(serialKeys.detailView(1, "recent"), makeDetailResponse([1]));

    const snapshot = patchSeasonsInDetailViewCache(queryClient, 1, "all", { watched: true });
    restoreQueries(queryClient, snapshot);

    const data = queryClient.getQueryData(
      serialKeys.detailView(1, "recent"),
    ) as SerialDetailResponse;
    expect(data.series.seasons[0]!.viewerInteraction?.watched).toBe(false);
  });
});

describe("patchEpisodesInSeasonDetailCache", () => {
  it("scopes to a single episode within a single season when both are given", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(serialKeys.seasonDetail(1, 1), makeSeasonDetailResponse([1, 2]));
    queryClient.setQueryData(serialKeys.seasonDetail(1, 2), makeSeasonDetailResponse([1, 2]));

    patchEpisodesInSeasonDetailCache(queryClient, 1, 1, { watched: true }, 1);

    const season1 = queryClient.getQueryData(
      serialKeys.seasonDetail(1, 1),
    ) as SerialSeasonDetailResponse;
    expect(season1.episodes.find((e) => e.episodeNumber === 1)?.viewerInteraction?.watched).toBe(
      true,
    );
    expect(season1.episodes.find((e) => e.episodeNumber === 2)?.viewerInteraction?.watched).toBe(
      false,
    );

    const season2 = queryClient.getQueryData(
      serialKeys.seasonDetail(1, 2),
    ) as SerialSeasonDetailResponse;
    expect(season2.episodes.every((e) => e.viewerInteraction?.watched === false)).toBe(true);
  });

  it("patches every episode in a season when episodeNumber is omitted", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(serialKeys.seasonDetail(1, 1), makeSeasonDetailResponse([1, 2, 3]));

    patchEpisodesInSeasonDetailCache(queryClient, 1, 1, { watched: true });

    const data = queryClient.getQueryData(
      serialKeys.seasonDetail(1, 1),
    ) as SerialSeasonDetailResponse;
    expect(data.episodes.every((e) => e.viewerInteraction?.watched === true)).toBe(true);
  });

  it("patches every cached season for the series when seasonNumber is 'all'", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(serialKeys.seasonDetail(1, 1), makeSeasonDetailResponse([1]));
    queryClient.setQueryData(serialKeys.seasonDetail(1, 2), makeSeasonDetailResponse([1]));

    patchEpisodesInSeasonDetailCache(queryClient, 1, "all", { watched: true });

    for (const seasonNumber of [1, 2]) {
      const data = queryClient.getQueryData(
        serialKeys.seasonDetail(1, seasonNumber),
      ) as SerialSeasonDetailResponse;
      expect(data.episodes[0]!.viewerInteraction?.watched).toBe(true);
    }
  });
});
