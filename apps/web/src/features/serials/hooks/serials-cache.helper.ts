import type { QueryClient } from "@tanstack/react-query";
import type {
  SerialDetailResponse,
  SerialSeasonDetailResponse,
} from "@/features/serials/api";
import { serialKeys } from "@/features/serials/hooks/serials/query-keys";

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
  const queryKey = serialKeys.detailViewRoot(tmdbId);
  const previousQueries = queryClient.getQueriesData<SerialDetailResponse>({ queryKey });

  queryClient.setQueriesData<SerialDetailResponse>({ queryKey }, (old) => {
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
      ? serialKeys.seasonDetailRoot(tmdbId)
      : serialKeys.seasonDetail(tmdbId, seasonNumber);
  const previousQueries = queryClient.getQueriesData<SerialSeasonDetailResponse>({ queryKey });

  queryClient.setQueriesData<SerialSeasonDetailResponse>({ queryKey }, (old) => {
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
