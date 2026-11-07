import type { QueryClient } from "@tanstack/react-query";
import type {
  SeriesDetailResponse,
  SeriesSeasonDetailResponse,
} from "@/features/tv/api";
import { seriesKeys } from "@/features/tv/hooks/tv/query-keys";

export type ViewerInteractionPatch = {
  watched?: boolean;
  liked?: boolean;
  rating?: number | null;
};

type ViewerInteraction = { watched: boolean; liked: boolean; rating: number | null; hasReview: boolean } | null;

const patchViewerInteraction = (
  viewerInteraction: ViewerInteraction,
  patch: ViewerInteractionPatch,
): ViewerInteraction => {
  if (!viewerInteraction) {
    return viewerInteraction;
  }

  return {
    ...viewerInteraction,
    ...(patch.watched !== undefined ? { watched: patch.watched } : {}),
    ...(patch.liked !== undefined ? { liked: patch.liked } : {}),
    ...(patch.rating !== undefined ? { rating: patch.rating } : {}),
  };
};

// Optimistically patches every cached detail-view variant (all reviewsSort
// options) for a series, so the season row(s) flip instantly instead of
// waiting on the (potentially multi-second, TMDB-backed) cascade response.
// seasonNumber "all" patches every season - used when the series-level
// Watch toggle cascades to all of them.
export const patchSeasonsInDetailViewCache = (
  queryClient: QueryClient,
  tmdbId: number,
  seasonNumber: number | "all",
  patch: ViewerInteractionPatch,
) => {
  const queryKey = seriesKeys.detailViewRoot(tmdbId);
  const previousQueries = queryClient.getQueriesData<SeriesDetailResponse>({ queryKey });

  queryClient.setQueriesData<SeriesDetailResponse>({ queryKey }, (old) => {
    if (!old) {
      return old;
    }

    return {
      ...old,
      series: {
        ...old.series,
        seasons: old.series.seasons.map((season) =>
          seasonNumber === "all" || season.seasonNumber === seasonNumber
            ? { ...season, viewerInteraction: patchViewerInteraction(season.viewerInteraction, patch) }
            : season,
        ),
      },
    };
  });

  return previousQueries;
};

type NextUpPatch = {
  // Applies while next up sits in this season at an episode this returns true for.
  when: (episodeNumber: number) => boolean;
  next: { episodeNumber: number; name: string } | null;
};

// Moves a season's watched-episode count to toNext(current, size), clamped to the
// season, and shifts the series total by the same amount (specials don't count there).
export const shiftWatchedCountsInDetailViewCache = (
  queryClient: QueryClient,
  tmdbId: number,
  seasonNumber: number,
  toNext: (current: number, episodeCount: number | null) => number,
  nextUp?: NextUpPatch,
) => {
  const queryKey = seriesKeys.detailViewRoot(tmdbId);
  const previousQueries = queryClient.getQueriesData<SeriesDetailResponse>({ queryKey });

  queryClient.setQueriesData<SeriesDetailResponse>({ queryKey }, (old) => {
    if (!old) return old;
    let delta = 0;
    const seasons = old.series.seasons.map((season) => {
      if (season.seasonNumber !== seasonNumber) return season;
      const next = Math.max(
        0,
        Math.min(season.episodeCount ?? Number.POSITIVE_INFINITY, toNext(season.watchedEpisodeCount, season.episodeCount)),
      );
      delta = next - season.watchedEpisodeCount;
      return { ...season, watchedEpisodeCount: next };
    });
    const tracking = old.viewerTracking;
    if (!tracking || seasonNumber === 0) return { ...old, series: { ...old.series, seasons } };

    const current = tracking.currentEpisode;
    const size = seasons.find((season) => season.seasonNumber === seasonNumber)?.episodeCount ?? null;
    const advance =
      nextUp?.next &&
      current?.seasonNumber === seasonNumber &&
      nextUp.when(current.episodeNumber) &&
      (size === null || nextUp.next.episodeNumber <= size);

    return {
      ...old,
      series: { ...old.series, seasons },
      viewerTracking: {
        ...tracking,
        watchedEpisodesCount: Math.max(0, tracking.watchedEpisodesCount + delta),
        currentEpisode: advance && nextUp?.next ? { seasonNumber, ...nextUp.next } : current,
      },
    };
  });

  return previousQueries;
};

// Optimistically patches cached season-detail (episode list) queries.
// seasonNumber "all" touches every cached season's episodes (series-level
// cascade); a specific number scopes to that season, optionally further
// scoped to a single episodeNumber (plain episode toggle, no cascade).
export const patchEpisodesInSeasonDetailCache = (
  queryClient: QueryClient,
  tmdbId: number,
  seasonNumber: number | "all",
  patch: ViewerInteractionPatch,
  episodeNumber?: number,
) => {
  const queryKey =
    seasonNumber === "all"
      ? seriesKeys.seasonDetailRoot(tmdbId)
      : seriesKeys.seasonDetail(tmdbId, seasonNumber);
  const previousQueries = queryClient.getQueriesData<SeriesSeasonDetailResponse>({ queryKey });

  queryClient.setQueriesData<SeriesSeasonDetailResponse>({ queryKey }, (old) => {
    if (!old) {
      return old;
    }

    return {
      ...old,
      episodes: old.episodes.map((episode) =>
        episodeNumber === undefined || episode.episodeNumber === episodeNumber
          ? { ...episode, viewerInteraction: patchViewerInteraction(episode.viewerInteraction, patch) }
          : episode,
      ),
    };
  });

  return previousQueries;
};

export { restoreQueries } from "@/lib/query-optimistic";
