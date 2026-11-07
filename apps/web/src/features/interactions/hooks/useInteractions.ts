import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getFilmInteraction,
  updateFilmInteraction,
  type FilmInteraction,
  type UpdateFilmInteractionInput,
} from "@/features/interactions/api";
import { interactionKeys } from "@/features/interactions/hooks/interaction-keys";
import { changedInteractionFields, refreshAfter } from "@/features/media/media-refresh";

export { interactionKeys };

export const useFilmInteraction = (tmdbId: number, enabled = true) =>
  useQuery({
    queryKey: interactionKeys.detail(tmdbId),
    queryFn: () => getFilmInteraction(tmdbId),
    enabled,
  });

export const useUpdateFilmInteraction = (tmdbId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { errorToast: "Couldn't update this movie" },
    mutationFn: (input: UpdateFilmInteractionInput) =>
      updateFilmInteraction(tmdbId, input),
    onMutate: async (input) => {
      const queryKey = interactionKeys.detail(tmdbId);
      await queryClient.cancelQueries({ queryKey });

      const previousState = queryClient.getQueryData<FilmInteraction>(queryKey);
      if (previousState) {
        // Any rating/like interaction implicitly watched: true
        const isImplicitlyWatched =
          input.liked === true ||
          (input.rating !== undefined && input.rating !== null);

        queryClient.setQueryData<FilmInteraction>(queryKey, {
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
    onSettled: (_data, _error, input) =>
      refreshAfter(queryClient, {
        type: "interaction-changed",
        kind: "film",
        tmdbId,
        changed: changedInteractionFields(input),
      }),
  });
};
