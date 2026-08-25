import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateEpisodeInteraction,
  updateSeasonInteraction,
  type SerialSeasonDetailResponse,
} from "@/features/serials/api";
import {
  patchEpisodesInSeasonDetailCache,
  patchSeasonsInDetailViewCache,
  restoreQueries,
} from "@/features/serials/hooks/serials-cache.helper";
import { serialKeys } from "./query-keys";

export const useUpdateSeasonInteraction = (tmdbId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      seasonNumber,
      input,
    }: {
      seasonNumber: number;
      input: { watched?: boolean; liked?: boolean; rating?: number | null };
    }) => updateSeasonInteraction(tmdbId, seasonNumber, input),
    onMutate: async ({ seasonNumber, input }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: serialKeys.detailViewRoot(tmdbId) }),
        queryClient.cancelQueries({ queryKey: serialKeys.seasonDetail(tmdbId, seasonNumber) }),
      ]);

      const previousSeasonQueries = patchSeasonsInDetailViewCache(
        queryClient,
        tmdbId,
        seasonNumber,
        input,
      );

      // A season-level "watched" toggle cascades to every episode in that
      // season server-side - mirror it in the episode list cache too.
      const previousEpisodeQueries =
        input.watched !== undefined
          ? patchEpisodesInSeasonDetailCache(queryClient, tmdbId, seasonNumber, {
              watched: input.watched,
            })
          : [];

      return { previousSeasonQueries, previousEpisodeQueries };
    },
    onError: (_error, _variables, context) => {
      restoreQueries(queryClient, context?.previousSeasonQueries ?? []);
      restoreQueries(queryClient, context?.previousEpisodeQueries ?? []);
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: serialKeys.detailViewRoot(tmdbId),
        }),
        queryClient.invalidateQueries({
          queryKey: serialKeys.seasonDetail(tmdbId, variables.seasonNumber),
        }),
        queryClient.invalidateQueries({
          queryKey: serialKeys.interaction(tmdbId),
        }),
      ]);
    },
  });
};

export const useUpdateEpisodeInteraction = (tmdbId: number, seasonNumber: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      episodeNumber,
      input,
    }: {
      episodeNumber: number;
      input: { watched?: boolean; liked?: boolean; rating?: number | null };
    }) => updateEpisodeInteraction(tmdbId, seasonNumber, episodeNumber, input),
    onMutate: async ({ episodeNumber, input }) => {
      const seasonDetailKey = serialKeys.seasonDetail(tmdbId, seasonNumber);
      await queryClient.cancelQueries({ queryKey: seasonDetailKey });

      const previousEpisodeQueries = patchEpisodesInSeasonDetailCache(
        queryClient,
        tmdbId,
        seasonNumber,
        input,
        episodeNumber,
      );

      // Toggling an episode can complete (or break) the whole season - the
      // full episode list is already loaded for this open accordion, so
      // predict the season's new watched state from it instead of waiting
      // on a refetch. Mirrors syncSeasonWatchedFromEpisodes on the backend.
      let previousSeasonQueries: ReturnType<typeof patchSeasonsInDetailViewCache> = [];
      if (input.watched !== undefined) {
        const seasonEpisodes =
          queryClient.getQueryData<SerialSeasonDetailResponse>(seasonDetailKey)?.episodes;

        if (seasonEpisodes && seasonEpisodes.length > 0) {
          const allEpisodesWatched = seasonEpisodes.every(
            (episode) => episode.viewerInteraction?.watched ?? false,
          );

          await queryClient.cancelQueries({ queryKey: serialKeys.detailViewRoot(tmdbId) });
          previousSeasonQueries = patchSeasonsInDetailViewCache(queryClient, tmdbId, seasonNumber, {
            watched: allEpisodesWatched,
          });
        }
      }

      return { previousEpisodeQueries, previousSeasonQueries };
    },
    onError: (_error, _variables, context) => {
      restoreQueries(queryClient, context?.previousEpisodeQueries ?? []);
      restoreQueries(queryClient, context?.previousSeasonQueries ?? []);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: serialKeys.seasonDetail(tmdbId, seasonNumber),
        }),
        queryClient.invalidateQueries({
          queryKey: serialKeys.detailViewRoot(tmdbId),
        }),
        queryClient.invalidateQueries({
          queryKey: serialKeys.interaction(tmdbId),
        }),
      ]);
    },
  });
};
