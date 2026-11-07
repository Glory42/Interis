import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  markEpisodesWatchedThrough,
  updateEpisodeInteraction,
  updateSeasonInteraction,
  type SeriesSeasonDetailResponse,
} from "@/features/tv/api";
import {
  patchEpisodesInSeasonDetailCache,
  patchSeasonsInDetailViewCache,
  restoreQueries,
  shiftWatchedCountsInDetailViewCache,
} from "@/features/tv/hooks/tv-cache.helper";
import { invalidateViewerCurrentlyWatching } from "@/features/profile/hooks/useProfile";
import { invalidateFollowingFeed } from "@/features/feed/hooks/feed-cache.helper";
import { seriesKeys } from "./query-keys";

type CachedEpisode = SeriesSeasonDetailResponse["episodes"][number];

// Next up after episode `after`, read from the open season's episode list.
const firstUnwatchedAfter = (episodes: CachedEpisode[] | undefined, after: number) => {
  if (!episodes) return { episodeNumber: after + 1, name: `Episode ${after + 1}` };
  const next = episodes.find(
    (episode) => episode.episodeNumber > after && !episode.viewerInteraction?.watched,
  );
  return next ? { episodeNumber: next.episodeNumber, name: next.name } : null;
};

export const useUpdateSeasonInteraction = (tmdbId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { errorToast: "Couldn't update this season" },
    mutationFn: ({
      seasonNumber,
      input,
    }: {
      seasonNumber: number;
      input: { watched?: boolean; liked?: boolean; rating?: number | null };
    }) => updateSeasonInteraction(tmdbId, seasonNumber, input),
    onMutate: async ({ seasonNumber, input }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: seriesKeys.detailViewRoot(tmdbId) }),
        queryClient.cancelQueries({ queryKey: seriesKeys.seasonDetail(tmdbId, seasonNumber) }),
      ]);

      const watched = input.watched;
      const previousCountQueries =
        watched !== undefined
          ? shiftWatchedCountsInDetailViewCache(queryClient, tmdbId, seasonNumber, (current, size) =>
              watched ? (size ?? current) : 0,
            )
          : [];

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

      return { previousSeasonQueries, previousEpisodeQueries, previousCountQueries };
    },
    onError: (_error, _variables, context) => {
      restoreQueries(queryClient, context?.previousSeasonQueries ?? []);
      restoreQueries(queryClient, context?.previousEpisodeQueries ?? []);
      restoreQueries(queryClient, context?.previousCountQueries ?? []);
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: seriesKeys.detailViewRoot(tmdbId),
        }),
        queryClient.invalidateQueries({
          queryKey: seriesKeys.seasonDetail(tmdbId, variables.seasonNumber),
        }),
        queryClient.invalidateQueries({
          queryKey: seriesKeys.interaction(tmdbId),
        }),
        invalidateViewerCurrentlyWatching(queryClient),
        invalidateFollowingFeed(queryClient),
      ]);
    },
  });
};

export const useUpdateEpisodeInteraction = (tmdbId: number, seasonNumber: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { errorToast: "Couldn't update this episode" },
    mutationFn: ({
      episodeNumber,
      input,
    }: {
      episodeNumber: number;
      input: { watched?: boolean; liked?: boolean; rating?: number | null };
    }) => updateEpisodeInteraction(tmdbId, seasonNumber, episodeNumber, input),
    onMutate: async ({ episodeNumber, input }) => {
      const seasonDetailKey = seriesKeys.seasonDetail(tmdbId, seasonNumber);
      await Promise.all([
        queryClient.cancelQueries({ queryKey: seasonDetailKey }),
        queryClient.cancelQueries({ queryKey: seriesKeys.detailViewRoot(tmdbId) }),
      ]);

      const watched = input.watched;
      const cachedEpisodes = queryClient.getQueryData<SeriesSeasonDetailResponse>(seasonDetailKey)?.episodes;
      const wasWatched = cachedEpisodes?.find((episode) => episode.episodeNumber === episodeNumber)?.viewerInteraction
        ?.watched;
      const previousCountQueries =
        watched !== undefined && wasWatched !== watched
          ? shiftWatchedCountsInDetailViewCache(
              queryClient,
              tmdbId,
              seasonNumber,
              (current) => current + (watched ? 1 : -1),
              watched
                ? { when: (current) => current === episodeNumber, next: firstUnwatchedAfter(cachedEpisodes, episodeNumber) }
                : undefined,
            )
          : [];

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
          queryClient.getQueryData<SeriesSeasonDetailResponse>(seasonDetailKey)?.episodes;

        if (seasonEpisodes && seasonEpisodes.length > 0) {
          const allEpisodesWatched = seasonEpisodes.every(
            (episode) => episode.viewerInteraction?.watched ?? false,
          );

          await queryClient.cancelQueries({ queryKey: seriesKeys.detailViewRoot(tmdbId) });
          previousSeasonQueries = patchSeasonsInDetailViewCache(queryClient, tmdbId, seasonNumber, {
            watched: allEpisodesWatched,
          });
        }
      }

      return { previousEpisodeQueries, previousSeasonQueries, previousCountQueries };
    },
    onError: (_error, _variables, context) => {
      restoreQueries(queryClient, context?.previousEpisodeQueries ?? []);
      restoreQueries(queryClient, context?.previousSeasonQueries ?? []);
      restoreQueries(queryClient, context?.previousCountQueries ?? []);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: seriesKeys.seasonDetail(tmdbId, seasonNumber),
        }),
        queryClient.invalidateQueries({
          queryKey: seriesKeys.detailViewRoot(tmdbId),
        }),
        queryClient.invalidateQueries({
          queryKey: seriesKeys.interaction(tmdbId),
        }),
        invalidateViewerCurrentlyWatching(queryClient),
        invalidateFollowingFeed(queryClient),
      ]);
    },
  });
};

export const useMarkWatchedThrough = (tmdbId: number, seasonNumber: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { errorToast: "Couldn't mark those episodes watched" },
    mutationFn: (episodeNumber: number) => markEpisodesWatchedThrough(tmdbId, seasonNumber, episodeNumber),
    onMutate: async (episodeNumber) => {
      const seasonDetailKey = seriesKeys.seasonDetail(tmdbId, seasonNumber);
      await Promise.all([
        queryClient.cancelQueries({ queryKey: seasonDetailKey }),
        queryClient.cancelQueries({ queryKey: seriesKeys.detailViewRoot(tmdbId) }),
      ]);
      const cachedEpisodes = queryClient.getQueryData<SeriesSeasonDetailResponse>(seasonDetailKey)?.episodes;
      const newlyWatched = cachedEpisodes?.filter(
        (episode) => episode.episodeNumber <= episodeNumber && !episode.viewerInteraction?.watched,
      ).length;
      const previousCountQueries = shiftWatchedCountsInDetailViewCache(
        queryClient,
        tmdbId,
        seasonNumber,
        (current) => (newlyWatched === undefined ? Math.max(current, episodeNumber) : current + newlyWatched),
        { when: (current) => current <= episodeNumber, next: firstUnwatchedAfter(cachedEpisodes, episodeNumber) },
      );
      const previousEpisodeQueries = queryClient.getQueriesData<SeriesSeasonDetailResponse>({
        queryKey: seasonDetailKey,
      });
      queryClient.setQueriesData<SeriesSeasonDetailResponse>({ queryKey: seasonDetailKey }, (old) =>
        old
          ? {
              ...old,
              episodes: old.episodes.map((episode) =>
                episode.episodeNumber <= episodeNumber
                  ? {
                      ...episode,
                      viewerInteraction: {
                        liked: false,
                        rating: null,
                        hasReview: false,
                        ...episode.viewerInteraction,
                        watched: true,
                      },
                    }
                  : episode,
              ),
            }
          : old,
      );
      return { previousEpisodeQueries, previousCountQueries };
    },
    onError: (_error, _variables, context) => {
      restoreQueries(queryClient, context?.previousEpisodeQueries ?? []);
      restoreQueries(queryClient, context?.previousCountQueries ?? []);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: seriesKeys.seasonDetail(tmdbId, seasonNumber) }),
        queryClient.invalidateQueries({ queryKey: seriesKeys.detailViewRoot(tmdbId) }),
        queryClient.invalidateQueries({ queryKey: seriesKeys.interaction(tmdbId) }),
        invalidateViewerCurrentlyWatching(queryClient),
        invalidateFollowingFeed(queryClient),
      ]);
    },
  });
};
