import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMovieInteraction,
  updateMovieInteraction,
  type MovieInteraction,
  type UpdateMovieInteractionInput,
} from "@/features/interactions/api";
import { movieKeys } from "@/features/films/hooks/useMovies";

export const interactionKeys = {
  detail: (tmdbId: number) => ["interactions", "movie", tmdbId] as const,
};

export const useMovieInteraction = (tmdbId: number, enabled = true) =>
  useQuery({
    queryKey: interactionKeys.detail(tmdbId),
    queryFn: () => getMovieInteraction(tmdbId),
    enabled,
  });

export const useUpdateMovieInteraction = (tmdbId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateMovieInteractionInput) =>
      updateMovieInteraction(tmdbId, input),
    onMutate: async (input) => {
      const queryKey = interactionKeys.detail(tmdbId);
      await queryClient.cancelQueries({ queryKey });

      const previousState = queryClient.getQueryData<MovieInteraction>(queryKey);
      if (previousState) {
        // Any rating/like interaction implicitly watched: true
        const isImplicitlyWatched =
          input.liked === true ||
          (input.rating !== undefined && input.rating !== null);

        queryClient.setQueryData<MovieInteraction>(queryKey, {
          ...previousState,
          ...(input.liked !== undefined ? { liked: input.liked } : {}),
          ...(input.watchlisted !== undefined
            ? { watchlisted: input.watchlisted }
            : {}),
          ...(input.rating !== undefined
            ? { rating: input.rating }
            : {}),
          ...(input.watched !== undefined ? { watched: input.watched } : {}),
          ...(isImplicitlyWatched ? { watched: true } : {}),
        });
      }

      return { previousState };
    },
    onError: (_error, _input, context) => {
      if (!context?.previousState) {
        return;
      }

      queryClient.setQueryData(
        interactionKeys.detail(tmdbId),
        context.previousState,
      );
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: interactionKeys.detail(tmdbId),
        }),
        queryClient.invalidateQueries({
          queryKey: movieKeys.detail(tmdbId),
        }),
        // Prefix-matches every reviewsSort variant for this movie only.
        queryClient.invalidateQueries({
          queryKey: ["movies", "detail-view", tmdbId],
        }),
        queryClient.invalidateQueries({
          queryKey: movieKeys.logs(tmdbId),
        }),
      ]);
    },
  });
};
