import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createSeriesLog,
  updateSeriesInteraction,
  type CreateSeriesLogInput,
  type SeriesInteraction,
  type UpdateSeriesInteractionInput,
} from "@/features/tv/api";
import {
  patchEpisodesInSeasonDetailCache,
  patchSeasonsInDetailViewCache,
  restoreQueries,
} from "@/features/tv/hooks/tv-cache.helper";
import { changedInteractionFields, refreshAfter } from "@/features/media/media-refresh";
import { seriesKeys } from "./query-keys";

export const useUpdateSeriesInteraction = (tmdbId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { errorToast: "Couldn't update this series" },
    mutationFn: (input: UpdateSeriesInteractionInput) =>
      updateSeriesInteraction(tmdbId, input),
    onMutate: async (input) => {
      const queryKey = seriesKeys.interaction(tmdbId);
      await queryClient.cancelQueries({ queryKey });

      const previousState = queryClient.getQueryData<SeriesInteraction>(queryKey);
      if (previousState) {
        queryClient.setQueryData<SeriesInteraction>(queryKey, {
          ...previousState,
          ...(input.liked !== undefined ? { liked: input.liked } : {}),
          ...(input.watchlisted !== undefined
            ? { watchlisted: input.watchlisted }
            : {}),
          ...(input.rating !== undefined
            ? { rating: input.rating }
            : {}),
          ...(input.watched !== undefined
            ? { watched: input.watched, watchStatus: input.watched ? "completed" : null }
            : {}),
          ...(input.watched === undefined && input.watchStatus !== undefined
            ? { watchStatus: input.watchStatus }
            : {}),
        });
      }

      // Mirrors SerialsActivityService.updateInteraction: only an explicit
      // watched toggle cascades to seasons/episodes (liking or rating doesn't),
      // so season rows don't show stale state until the TMDB-backed cascade
      // response (potentially multi-second) comes back.
      const shouldCascade = input.watched !== undefined;
      let previousSeasonQueries: ReturnType<typeof patchSeasonsInDetailViewCache> = [];
      let previousEpisodeQueries: ReturnType<typeof patchEpisodesInSeasonDetailCache> = [];
      if (shouldCascade) {
        await Promise.all([
          queryClient.cancelQueries({ queryKey: seriesKeys.detailViewRoot(tmdbId) }),
          queryClient.cancelQueries({ queryKey: seriesKeys.seasonDetailRoot(tmdbId) }),
        ]);

        const cascadeWatched = input.watched ?? false;
        previousSeasonQueries = patchSeasonsInDetailViewCache(queryClient, tmdbId, "all", {
          watched: cascadeWatched,
        });
        previousEpisodeQueries = patchEpisodesInSeasonDetailCache(queryClient, tmdbId, "all", {
          watched: cascadeWatched,
        });
      }

      return { previousState, previousSeasonQueries, previousEpisodeQueries };
    },
    onError: (_error, _input, context) => {
      if (context?.previousState) {
        queryClient.setQueryData(seriesKeys.interaction(tmdbId), context.previousState);
      }

      restoreQueries(queryClient, context?.previousSeasonQueries ?? []);
      restoreQueries(queryClient, context?.previousEpisodeQueries ?? []);
    },
    onSettled: (_data, _error, input) =>
      refreshAfter(queryClient, {
        type: "interaction-changed",
        kind: "tv",
        tmdbId,
        changed: changedInteractionFields(input),
      }),
  });
};

// Editing and deleting a series log go through useOwnLogActions.
export const useCreateSeriesLog = (tmdbId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSeriesLogInput) => createSeriesLog(tmdbId, input),
    onSuccess: (_data, input) =>
      refreshAfter(queryClient, { type: "log-created", kind: "tv", tmdbId, hasReview: Boolean(input.review) }),
  });
};
