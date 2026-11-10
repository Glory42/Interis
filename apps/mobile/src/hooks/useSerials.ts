import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSeriesArchive,
  getSeriesDetail,
  getSeriesInteraction,
  getSeriesSeasonDetail,
  updateEpisodeInteraction,
  updateSeasonInteraction,
  updateSeriesInteraction,
  type SerialArchiveInput,
} from "@/api/serials";
import { getErrorMessage } from "@/api/client";
import { showToast } from "@/lib/toast";
import type { ReviewSort } from "@/types/common";
import type {
  SerialInteraction,
  SerialSeasonDetail,
  UpdateSerialInteractionInput,
} from "@/types/serials";

export const serialKeys = {
  archive: (input: Omit<SerialArchiveInput, "page">) => ["serials", "archive", input] as const,
  detailRoot: (tmdbId: number) => ["serials", "detail", tmdbId] as const,
  detail: (tmdbId: number, sort: ReviewSort) => ["serials", "detail", tmdbId, sort] as const,
  season: (tmdbId: number, seasonNumber: number) =>
    ["serials", "season", tmdbId, seasonNumber] as const,
  interaction: (tmdbId: number) => ["serials", "interaction", tmdbId] as const,
};

const ARCHIVE_PAGE_SIZE = 24;

export const useSeriesArchive = (input: Omit<SerialArchiveInput, "page" | "limit">) =>
  useInfiniteQuery({
    queryKey: serialKeys.archive(input),
    queryFn: ({ pageParam, signal }) =>
      getSeriesArchive({ ...input, page: pageParam, limit: ARCHIVE_PAGE_SIZE }, { signal }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextPage ?? undefined : undefined),
  });

export const useSeriesDetail = (tmdbId: number, sort: ReviewSort) =>
  useQuery({
    queryKey: serialKeys.detail(tmdbId, sort),
    queryFn: ({ signal }) => getSeriesDetail(tmdbId, sort, { signal }),
    enabled: Number.isInteger(tmdbId) && tmdbId > 0,
  });

export const useSeasonDetail = (tmdbId: number, seasonNumber: number) =>
  useQuery({
    queryKey: serialKeys.season(tmdbId, seasonNumber),
    queryFn: ({ signal }) => getSeriesSeasonDetail(tmdbId, seasonNumber, { signal }),
    enabled: Number.isInteger(tmdbId) && tmdbId > 0 && Number.isInteger(seasonNumber),
  });

export const useSeriesInteraction = (tmdbId: number, enabled: boolean) =>
  useQuery({
    queryKey: serialKeys.interaction(tmdbId),
    queryFn: () => getSeriesInteraction(tmdbId),
    enabled,
  });

export const useUpdateSeriesInteraction = (tmdbId: number) => {
  const queryClient = useQueryClient();
  const key = serialKeys.interaction(tmdbId);

  return useMutation({
    mutationFn: (input: UpdateSerialInteractionInput) => updateSeriesInteraction(tmdbId, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<SerialInteraction>(key);
      if (previous) {
        queryClient.setQueryData<SerialInteraction>(key, { ...previous, ...input });
      }
      return { previous };
    },
    onError: (error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
      showToast(getErrorMessage(error, "Could not update this series."));
    },
    onSuccess: (data) => {
      queryClient.setQueryData(key, data);
      void queryClient.invalidateQueries({ queryKey: serialKeys.detailRoot(tmdbId) });
    },
  });
};

type EpisodeToggle = { episodeNumber: number; watched: boolean };

export const useToggleEpisodeWatched = (tmdbId: number, seasonNumber: number) => {
  const queryClient = useQueryClient();
  const key = serialKeys.season(tmdbId, seasonNumber);

  return useMutation({
    mutationFn: ({ episodeNumber, watched }: EpisodeToggle) =>
      updateEpisodeInteraction(tmdbId, seasonNumber, episodeNumber, { watched }),
    onMutate: async ({ episodeNumber, watched }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<SerialSeasonDetail>(key);
      if (previous) {
        queryClient.setQueryData<SerialSeasonDetail>(key, {
          ...previous,
          episodes: previous.episodes.map((episode) =>
            episode.episodeNumber === episodeNumber
              ? {
                  ...episode,
                  viewerInteraction: {
                    liked: episode.viewerInteraction?.liked ?? false,
                    rating: episode.viewerInteraction?.rating ?? null,
                    hasReview: episode.viewerInteraction?.hasReview ?? false,
                    watched,
                  },
                }
              : episode,
          ),
        });
      }
      return { previous };
    },
    onError: (error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
      showToast(getErrorMessage(error, "Could not update this episode."));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: serialKeys.detailRoot(tmdbId) });
      void queryClient.invalidateQueries({ queryKey: serialKeys.interaction(tmdbId) });
    },
  });
};

export const useToggleSeasonWatched = (tmdbId: number, seasonNumber: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (watched: boolean) => updateSeasonInteraction(tmdbId, seasonNumber, { watched }),
    onError: (error) => showToast(getErrorMessage(error, "Could not update this season.")),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: serialKeys.season(tmdbId, seasonNumber) }),
        queryClient.invalidateQueries({ queryKey: serialKeys.detailRoot(tmdbId) }),
        queryClient.invalidateQueries({ queryKey: serialKeys.interaction(tmdbId) }),
      ]),
  });
};
