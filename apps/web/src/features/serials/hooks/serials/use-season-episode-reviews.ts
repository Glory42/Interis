import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateFollowingFeed } from "@/features/feed/hooks/feed-cache.helper";
import {
  deleteEpisodeReview,
  deleteSeasonReview,
  getEpisodeReview,
  getSeasonReview,
  upsertEpisodeReview,
  upsertSeasonReview,
} from "@/features/serials/api";
import { serialKeys } from "./query-keys";

export const useSeasonReview = (tmdbId: number, seasonNumber: number, enabled = true) =>
  useQuery({
    queryKey: serialKeys.seasonReview(tmdbId, seasonNumber),
    queryFn: () => getSeasonReview(tmdbId, seasonNumber),
    enabled,
  });

export const useUpsertSeasonReview = (tmdbId: number, seasonNumber: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { content: string; containsSpoilers?: boolean }) =>
      upsertSeasonReview(tmdbId, seasonNumber, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: serialKeys.seasonReview(tmdbId, seasonNumber),
        }),
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
    mutationFn: () => deleteSeasonReview(tmdbId, seasonNumber),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: serialKeys.seasonReview(tmdbId, seasonNumber),
        }),
        queryClient.invalidateQueries({
          queryKey: serialKeys.detailViewRoot(tmdbId),
        }),
        invalidateFollowingFeed(queryClient),
      ]);
    },
  });
};

export const useEpisodeReview = (
  tmdbId: number,
  seasonNumber: number,
  episodeNumber: number,
  enabled = true,
) =>
  useQuery({
    queryKey: serialKeys.episodeReview(tmdbId, seasonNumber, episodeNumber),
    queryFn: () => getEpisodeReview(tmdbId, seasonNumber, episodeNumber),
    enabled,
  });

export const useUpsertEpisodeReview = (
  tmdbId: number,
  seasonNumber: number,
  episodeNumber: number,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { content: string; containsSpoilers?: boolean }) =>
      upsertEpisodeReview(tmdbId, seasonNumber, episodeNumber, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: serialKeys.episodeReview(tmdbId, seasonNumber, episodeNumber),
        }),
        queryClient.invalidateQueries({
          queryKey: serialKeys.seasonDetail(tmdbId, seasonNumber),
        }),
        invalidateFollowingFeed(queryClient),
      ]);
    },
  });
};

export const useDeleteEpisodeReview = (
  tmdbId: number,
  seasonNumber: number,
  episodeNumber: number,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteEpisodeReview(tmdbId, seasonNumber, episodeNumber),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: serialKeys.episodeReview(tmdbId, seasonNumber, episodeNumber),
        }),
        queryClient.invalidateQueries({
          queryKey: serialKeys.seasonDetail(tmdbId, seasonNumber),
        }),
        invalidateFollowingFeed(queryClient),
      ]);
    },
  });
};
