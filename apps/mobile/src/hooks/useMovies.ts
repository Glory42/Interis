import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMovieArchive,
  getMovieDetail,
  getMovieInteraction,
  updateMovieInteraction,
  type MovieArchiveInput,
} from "@/api/movies";
import { getErrorMessage } from "@/api/client";
import { showToast } from "@/lib/toast";
import type { ReviewSort } from "@/types/common";
import type { MovieInteraction, UpdateMovieInteractionInput } from "@/types/movies";

export const movieKeys = {
  archive: (input: Omit<MovieArchiveInput, "page">) => ["movies", "archive", input] as const,
  detailRoot: (tmdbId: number) => ["movies", "detail", tmdbId] as const,
  detail: (tmdbId: number, sort: ReviewSort) => ["movies", "detail", tmdbId, sort] as const,
  interaction: (tmdbId: number) => ["movies", "interaction", tmdbId] as const,
};

const ARCHIVE_PAGE_SIZE = 24;

export const useMovieArchive = (input: Omit<MovieArchiveInput, "page" | "limit">) =>
  useInfiniteQuery({
    queryKey: movieKeys.archive(input),
    queryFn: ({ pageParam, signal }) =>
      getMovieArchive({ ...input, page: pageParam, limit: ARCHIVE_PAGE_SIZE }, { signal }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextPage ?? undefined : undefined),
  });

export const useMovieDetail = (tmdbId: number, sort: ReviewSort) =>
  useQuery({
    queryKey: movieKeys.detail(tmdbId, sort),
    queryFn: ({ signal }) => getMovieDetail(tmdbId, sort, { signal }),
    enabled: Number.isInteger(tmdbId) && tmdbId > 0,
  });

export const useMovieInteraction = (tmdbId: number, enabled: boolean) =>
  useQuery({
    queryKey: movieKeys.interaction(tmdbId),
    queryFn: () => getMovieInteraction(tmdbId),
    enabled,
  });

export const useUpdateMovieInteraction = (tmdbId: number) => {
  const queryClient = useQueryClient();
  const key = movieKeys.interaction(tmdbId);

  return useMutation({
    mutationFn: (input: UpdateMovieInteractionInput) => updateMovieInteraction(tmdbId, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<MovieInteraction>(key);
      if (previous) {
        queryClient.setQueryData<MovieInteraction>(key, { ...previous, ...input });
      }
      return { previous };
    },
    onError: (error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
      showToast(getErrorMessage(error, "Could not update this title."));
    },
    onSuccess: (data) => {
      queryClient.setQueryData(key, data);
      // Only the detail view shows rating/watched aggregates that this
      // touches - leave archive/search caches alone.
      void queryClient.invalidateQueries({ queryKey: movieKeys.detailRoot(tmdbId) });
    },
  });
};
