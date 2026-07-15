import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteEpisodeReview,
  deleteSeasonReview,
  getEpisodeReview,
  getSeasonReview,
  upsertEpisodeReview,
  upsertSeasonReview,
} from "@/features/serials/api";

export const useSeasonReview = (tmdbId: number, seasonNumber: number, enabled = true) =>
  useQuery({
    queryKey: ["serials", "season-review", tmdbId, seasonNumber],
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
          queryKey: ["serials", "season-review", tmdbId, seasonNumber],
        }),
        queryClient.invalidateQueries({
          queryKey: ["serials", "detail-view", tmdbId],
        }),
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
          queryKey: ["serials", "season-review", tmdbId, seasonNumber],
        }),
        queryClient.invalidateQueries({
          queryKey: ["serials", "detail-view", tmdbId],
        }),
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
    queryKey: ["serials", "episode-review", tmdbId, seasonNumber, episodeNumber],
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
          queryKey: ["serials", "episode-review", tmdbId, seasonNumber, episodeNumber],
        }),
        queryClient.invalidateQueries({
          queryKey: ["serials", "season-detail", tmdbId, seasonNumber],
        }),
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
          queryKey: ["serials", "episode-review", tmdbId, seasonNumber, episodeNumber],
        }),
        queryClient.invalidateQueries({
          queryKey: ["serials", "season-detail", tmdbId, seasonNumber],
        }),
      ]);
    },
  });
};
