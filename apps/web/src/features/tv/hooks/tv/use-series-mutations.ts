import { updateSeriesInteraction, type UpdateSeriesInteractionInput } from "@/features/tv/api";
import { useMediaMutation } from "@/features/media/use-media-mutation";

export const useUpdateSeriesInteraction = (tmdbId: number) =>
  useMediaMutation({
    errorToast: "Couldn't update this series",
    mutationFn: (input: UpdateSeriesInteractionInput) => updateSeriesInteraction(tmdbId, input),
    event: (input) => ({ type: "interaction-changed", kind: "tv", tmdbId, input }),
  });
