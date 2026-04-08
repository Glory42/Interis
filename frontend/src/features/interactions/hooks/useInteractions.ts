import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMovieInteraction,
  updateMovieInteraction,
  type MovieInteraction,
  type UpdateMovieInteractionInput,
} from "@/features/interactions/api";

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
        queryClient.setQueryData<MovieInteraction>(queryKey, {
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

      queryClient.setQueryData(
        interactionKeys.detail(tmdbId),
        context.previousState,
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: interactionKeys.detail(tmdbId),
      });
    },
  });
};
