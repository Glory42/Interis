import { useMutation, useQueryClient } from "@tanstack/react-query";
import { refreshAfter } from "@/features/media/media-cache";
import {
  deleteEpisodeReview,
  deleteSeasonReview,
  upsertEpisodeReview,
  upsertSeasonReview,
  type SeasonEpisodeReviewSaveInput,
} from "@/features/tv/api";

export const useUpsertSeasonReview = (tmdbId: number, seasonNumber: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SeasonEpisodeReviewSaveInput) =>
      upsertSeasonReview(tmdbId, seasonNumber, input),
    onSuccess: () =>
      refreshAfter(queryClient, { type: "season-review-changed", tmdbId, seasonNumber, episodeNumber: null }),
  });
};

export const useDeleteSeasonReview = (tmdbId: number, seasonNumber: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => deleteSeasonReview(tmdbId, seasonNumber, reviewId),
    onSuccess: () =>
      refreshAfter(queryClient, { type: "season-review-changed", tmdbId, seasonNumber, episodeNumber: null }),
  });
};

export const useUpsertEpisodeReview = (tmdbId: number, seasonNumber: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ episodeNumber, input }: { episodeNumber: number; input: SeasonEpisodeReviewSaveInput }) =>
      upsertEpisodeReview(tmdbId, seasonNumber, episodeNumber, input),
    onSuccess: (_data, { episodeNumber }) =>
      refreshAfter(queryClient, { type: "season-review-changed", tmdbId, seasonNumber, episodeNumber }),
  });
};

export const useDeleteEpisodeReview = (tmdbId: number, seasonNumber: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ episodeNumber, reviewId }: { episodeNumber: number; reviewId: string }) =>
      deleteEpisodeReview(tmdbId, seasonNumber, episodeNumber, reviewId),
    onSuccess: (_data, { episodeNumber }) =>
      refreshAfter(queryClient, { type: "season-review-changed", tmdbId, seasonNumber, episodeNumber }),
  });
};
