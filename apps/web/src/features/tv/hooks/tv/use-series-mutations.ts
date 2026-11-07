import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { authKeys } from "@/features/auth/hooks/useAuth";
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
import {
  invalidateViewerCurrentlyWatching,
  profileKeys,
} from "@/features/profile/hooks/useProfile";
import { profileStatsKeys } from "@/features/profile/hooks/useProfileStats";
import type { MeProfile } from "@/types/api";
import { invalidateFollowingFeed } from "@/features/feed/hooks/feed-cache.helper";
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
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: seriesKeys.interaction(tmdbId),
        }),
        queryClient.invalidateQueries({
          queryKey: seriesKeys.detail(tmdbId),
        }),
        // Prefix-matches every reviewsSort variant for this series only.
        queryClient.invalidateQueries({
          queryKey: seriesKeys.detailViewRoot(tmdbId),
        }),
        queryClient.invalidateQueries({
          queryKey: seriesKeys.logs(tmdbId),
        }),
        invalidateViewerCurrentlyWatching(queryClient),
        invalidateFollowingFeed(queryClient),
      ]);
    },
  });
};

// Editing and deleting a series log go through useOwnLogActions.
export const useCreateSeriesLog = (tmdbId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSeriesLogInput) => createSeriesLog(tmdbId, input),
    // Logging marks the series and every episode watched, a rated log sets
    // "Your rating", and the log lands in the viewer's diary, stats and
    // the feed (#97).
    onSuccess: async () => {
      const me = queryClient.getQueryData<MeProfile | null>(authKeys.me);
      const keys: QueryKey[] = [
        seriesKeys.detailViewRoot(tmdbId),
        seriesKeys.detail(tmdbId),
        seriesKeys.interaction(tmdbId),
        seriesKeys.seasonDetailRoot(tmdbId),
        seriesKeys.logs(tmdbId),
        seriesKeys.myLogs,
      ];
      if (me?.username) {
        keys.push(
          profileKeys.detail(me.username),
          profileKeys.diary(me.username),
          profileKeys.recentActivity(me.username, 20),
          profileStatsKeys.detail(me.username),
        );
      }

      await Promise.all([
        ...keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
        invalidateViewerCurrentlyWatching(queryClient),
        invalidateFollowingFeed(queryClient),
      ]);
    },
  });
};
