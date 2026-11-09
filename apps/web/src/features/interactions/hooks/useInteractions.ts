import { useQuery } from "@tanstack/react-query";
import {
  getFilmInteraction,
  updateFilmInteraction,
  type UpdateFilmInteractionInput,
} from "@/features/interactions/api";
import { interactionKeys } from "@/features/interactions/hooks/interaction-keys";
import { useMediaMutation } from "@/features/media/use-media-mutation";

export { interactionKeys };

export const useFilmInteraction = (tmdbId: number, enabled = true) =>
  useQuery({
    queryKey: interactionKeys.detail(tmdbId),
    queryFn: () => getFilmInteraction(tmdbId),
    enabled,
  });

export const useUpdateFilmInteraction = (tmdbId: number) =>
  useMediaMutation({
    errorToast: "Couldn't update this movie",
    mutationFn: (input: UpdateFilmInteractionInput) => updateFilmInteraction(tmdbId, input),
    event: (input) => ({ type: "interaction-changed", kind: "film", tmdbId, input }),
  });
