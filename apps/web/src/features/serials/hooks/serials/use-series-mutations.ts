import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createSeriesLog,
  deleteSerialLog,
  updateSerialLog,
  updateSeriesInteraction,
  type CreateSeriesLogInput,
  type SerialDiaryEntry,
  type SerialInteraction,
  type UpdateSerialInteractionInput,
  type UpdateSerialLogInput,
} from "@/features/serials/api";
import {
  patchEpisodesInSeasonDetailCache,
  patchSeasonsInDetailViewCache,
  restoreQueries,
} from "@/features/serials/hooks/serials-cache.helper";
import { serialKeys } from "./query-keys";

export const useUpdateSeriesInteraction = (tmdbId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSerialInteractionInput) =>
      updateSeriesInteraction(tmdbId, input),
    onMutate: async (input) => {
      const queryKey = serialKeys.interaction(tmdbId);
      await queryClient.cancelQueries({ queryKey });

      const previousState = queryClient.getQueryData<SerialInteraction>(queryKey);
      if (previousState) {
        queryClient.setQueryData<SerialInteraction>(queryKey, {
          ...previousState,
          ...(input.liked !== undefined ? { liked: input.liked } : {}),
          ...(input.watchlisted !== undefined
            ? { watchlisted: input.watchlisted }
            : {}),
          ...(input.rating !== undefined
            ? { rating: input.rating }
            : {}),
          ...(input.watched !== undefined ? { watched: input.watched } : {}),
        });
      }

      // Mirrors SerialsActivityService.updateInteraction's shouldCascadeSeasons
      // so season rows don't show stale state until the TMDB-backed cascade
      // response (potentially multi-second) comes back.
      const isImplicitlyWatched =
        input.liked === true || (input.rating !== undefined && input.rating !== null);
      const previousWatched = previousState?.watched ?? false;
      const resolvedWatched = input.watched ?? (isImplicitlyWatched ? true : undefined);
      const shouldCascade =
        input.watched !== undefined || (resolvedWatched === true && !previousWatched);

      let previousSeasonQueries: ReturnType<typeof patchSeasonsInDetailViewCache> = [];
      let previousEpisodeQueries: ReturnType<typeof patchEpisodesInSeasonDetailCache> = [];
      if (shouldCascade) {
        await Promise.all([
          queryClient.cancelQueries({ queryKey: ["serials", "detail-view", tmdbId] }),
          queryClient.cancelQueries({ queryKey: ["serials", "season-detail", tmdbId] }),
        ]);

        const cascadeWatched = resolvedWatched ?? false;
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
        queryClient.setQueryData(serialKeys.interaction(tmdbId), context.previousState);
      }

      restoreQueries(queryClient, context?.previousSeasonQueries ?? []);
      restoreQueries(queryClient, context?.previousEpisodeQueries ?? []);
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: serialKeys.interaction(tmdbId),
        }),
        queryClient.invalidateQueries({
          queryKey: serialKeys.detail(tmdbId),
        }),
        // Prefix-matches every reviewsSort variant for this series only.
        queryClient.invalidateQueries({
          queryKey: ["serials", "detail-view", tmdbId],
        }),
        queryClient.invalidateQueries({
          queryKey: serialKeys.logs(tmdbId),
        }),
      ]);
    },
  });
};

export const useCreateSeriesLog = (tmdbId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSeriesLogInput) => createSeriesLog(tmdbId, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["serials", "detail-view", tmdbId],
        }),
        queryClient.invalidateQueries({ queryKey: serialKeys.detail(tmdbId) }),
      ]);
    },
  });
};

export const useUpdateSerialLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, input }: { entryId: string; input: UpdateSerialLogInput }) =>
      updateSerialLog(entryId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serialKeys.myLogs });
    },
  });
};

export const useDeleteSerialLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) => deleteSerialLog(entryId),
    onSuccess: (_data, entryId) => {
      queryClient.invalidateQueries({ queryKey: serialKeys.myLogs });
      queryClient.setQueryData<SerialDiaryEntry[]>(serialKeys.myLogs, (prev) =>
        prev ? prev.filter((e) => e.id !== entryId) : prev,
      );
    },
  });
};
