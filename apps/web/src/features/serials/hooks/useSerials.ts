import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createSeriesLog,
  deleteSerialLog,
  getMySerialLogs,
  getRecentSeries,
  getSeriesArchive,
  getSeriesByTmdbId,
  getSeriesDetail,
  getSeriesInteraction,
  getSeriesLogs,
  getSeriesSeasonDetail,
  getTrendingSeries,
  searchSeries,
  type SerialArchivePeriod,
  type SerialArchiveSort,
  type CreateSeriesLogInput,
  type SerialDetailReviewSort,
  type SerialDiaryEntry,
  type SerialInteraction,
  type UpdateSerialInteractionInput,
  type UpdateSerialLogInput,
  updateSerialLog,
  updateSeriesInteraction,
  updateSeasonInteraction,
  updateEpisodeInteraction,
  getSeasonReview,
  upsertSeasonReview,
  deleteSeasonReview,
  getEpisodeReview,
  upsertEpisodeReview,
  deleteEpisodeReview,
} from "@/features/serials/api";

export const serialKeys = {
  all: ["serials"] as const,
  search: (query: string) => ["serials", "search", query] as const,
  detail: (tmdbId: number) => ["serials", "detail", tmdbId] as const,
  detailView: (tmdbId: number, reviewsSort: SerialDetailReviewSort) =>
    ["serials", "detail-view", tmdbId, reviewsSort] as const,
  seasonDetail: (tmdbId: number, seasonNumber: number) =>
    ["serials", "season-detail", tmdbId, seasonNumber] as const,
  interaction: (tmdbId: number) => ["serials", "interaction", tmdbId] as const,
  trending: ["serials", "trending"] as const,
  recent: ["serials", "recent"] as const,
  logs: (tmdbId: number) => ["serials", "logs", tmdbId] as const,
  myLogs: ["serials", "my-logs"] as const,
  archive: (
    genre: string,
    language: string,
    sort: SerialArchiveSort,
    period: SerialArchivePeriod,
    limit: number,
  ) => ["serials", "archive", genre, language, sort, period, limit] as const,
};

export const useSerialSearch = (query: string) =>
  useQuery({
    queryKey: serialKeys.search(query),
    queryFn: ({ signal }) => searchSeries(query, { signal }),
    enabled: query.trim().length >= 2,
  });

export const useSeriesDetail = (tmdbId: number, enabled = true) =>
  useQuery({
    queryKey: serialKeys.detail(tmdbId),
    queryFn: ({ signal }) => getSeriesByTmdbId(tmdbId, { signal }),
    enabled,
  });

export const useSeriesDetailView = (
  tmdbId: number,
  reviewsSort: SerialDetailReviewSort,
  enabled = true,
) =>
  useQuery({
    queryKey: serialKeys.detailView(tmdbId, reviewsSort),
    queryFn: ({ signal }) => getSeriesDetail(tmdbId, { reviewsSort }, { signal }),
    enabled,
  });

export const useSeriesInteraction = (tmdbId: number, enabled = true) =>
  useQuery({
    queryKey: serialKeys.interaction(tmdbId),
    queryFn: () => getSeriesInteraction(tmdbId),
    enabled,
  });

export const useSeriesSeasonDetail = (
  tmdbId: number,
  seasonNumber: number,
  enabled = true,
) =>
  useQuery({
    queryKey: serialKeys.seasonDetail(tmdbId, seasonNumber),
    queryFn: ({ signal }) => getSeriesSeasonDetail(tmdbId, seasonNumber, { signal }),
    enabled,
  });

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

      return { previousState };
    },
    onError: (_error, _input, context) => {
      if (!context?.previousState) {
        return;
      }

      queryClient.setQueryData(serialKeys.interaction(tmdbId), context.previousState);
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

export const useTrendingSeries = () =>
  useQuery({
    queryKey: serialKeys.trending,
    queryFn: ({ signal }) => getTrendingSeries({ signal }),
  });

export const useRecentSeries = () =>
  useQuery({
    queryKey: serialKeys.recent,
    queryFn: ({ signal }) => getRecentSeries({ signal }),
  });

export const useSeriesLogs = (tmdbId: number, enabled = true) =>
  useQuery({
    queryKey: serialKeys.logs(tmdbId),
    queryFn: ({ signal }) => getSeriesLogs(tmdbId, { signal }),
    enabled,
  });

export const useMySerialLogs = () =>
  useQuery({
    queryKey: serialKeys.myLogs,
    queryFn: getMySerialLogs,
  });

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

export const useSeriesArchive = (
  genre: string,
  language: string,
  sort: SerialArchiveSort,
  period: SerialArchivePeriod,
  limit: number,
) =>
  useInfiniteQuery({
    queryKey: serialKeys.archive(genre, language, sort, period, limit),
    initialPageParam: 1,
    queryFn: ({ signal, pageParam }) => {
      const page = typeof pageParam === "number" ? pageParam : 1;

      return getSeriesArchive(
        {
          genre,
          language,
          sort,
          period,
          page,
          limit,
        },
        { signal },
      );
    },
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
  });

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
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["serials", "detail-view", tmdbId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["serials", "season-detail", tmdbId, variables.seasonNumber],
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
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["serials", "season-detail", tmdbId, seasonNumber],
        }),
      ]);
    },
  });
};

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
