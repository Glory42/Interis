import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateFollowingFeed } from "@/features/feed/hooks/feed-cache.helper";
import {
  deleteEpisodeReview,
  deleteSeasonReview,
  upsertEpisodeReview,
  upsertSeasonReview,
  type SeasonEpisodeReviewSaveInput,
} from "@/features/serials/api";
import { serialKeys } from "./query-keys";

export const useUpsertSeasonReview = (tmdbId: number, seasonNumber: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SeasonEpisodeReviewSaveInput) =>
      upsertSeasonReview(tmdbId, seasonNumber, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: serialKeys.detailViewRoot(tmdbId),
        }),
        invalidateFollowingFeed(queryClient),
      ]);
    },
  });
};

export const useDeleteSeasonReview = (tmdbId: number, seasonNumber: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => deleteSeasonReview(tmdbId, seasonNumber, reviewId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: serialKeys.detailViewRoot(tmdbId),
        }),
        invalidateFollowingFeed(queryClient),
      ]);
    },
  });
};

export const useUpsertEpisodeReview = (tmdbId: number, seasonNumber: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ episodeNumber, input }: { episodeNumber: number; input: SeasonEpisodeReviewSaveInput }) =>
      upsertEpisodeReview(tmdbId, seasonNumber, episodeNumber, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: serialKeys.seasonDetail(tmdbId, seasonNumber),
        }),
        invalidateFollowingFeed(queryClient),
      ]);
    },
  });
};

export const useDeleteEpisodeReview = (tmdbId: number, seasonNumber: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ episodeNumber, reviewId }: { episodeNumber: number; reviewId: string }) =>
      deleteEpisodeReview(tmdbId, seasonNumber, episodeNumber, reviewId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: serialKeys.seasonDetail(tmdbId, seasonNumber),
        }),
        invalidateFollowingFeed(queryClient),
      ]);
    },
  });
};
