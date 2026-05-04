import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createSeriesLog,
  getSeriesArchive,
  getSeriesByTmdbId,
  getSeriesDetail,
  getSeriesInteraction,
  getSeriesSeasonDetail,
  getTrendingSeries,
  searchSeries,
  type SerialArchivePeriod,
  type SerialArchiveSort,
  type CreateSeriesLogInput,
  type SerialDetailReviewSort,
  type SerialInteraction,
  type UpdateSerialInteractionInput,
  updateSeriesInteraction,
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
          ...(input.ratingOutOfFive !== undefined
            ? { ratingOutOfFive: input.ratingOutOfFive }
            : {}),
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
      await queryClient.invalidateQueries({
        queryKey: serialKeys.interaction(tmdbId),
      });
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
