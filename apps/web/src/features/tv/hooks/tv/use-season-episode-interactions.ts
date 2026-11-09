import {
  markEpisodesWatchedThrough,
  updateEpisodeInteraction,
  updateSeasonInteraction,
} from "@/features/tv/api";
import type { SeasonInteractionInput } from "@/features/media/media-cache";
import { useMediaMutation } from "@/features/media/use-media-mutation";

export const useUpdateSeasonInteraction = (tmdbId: number) =>
  useMediaMutation({
    errorToast: "Couldn't update this season",
    mutationFn: ({ seasonNumber, input }: { seasonNumber: number; input: SeasonInteractionInput }) =>
      updateSeasonInteraction(tmdbId, seasonNumber, input),
    event: ({ seasonNumber, input }) => ({ type: "season-interaction-changed", tmdbId, seasonNumber, input }),
  });

export const useUpdateEpisodeInteraction = (tmdbId: number, seasonNumber: number) =>
  useMediaMutation({
    errorToast: "Couldn't update this episode",
    mutationFn: ({ episodeNumber, input }: { episodeNumber: number; input: SeasonInteractionInput }) =>
      updateEpisodeInteraction(tmdbId, seasonNumber, episodeNumber, input),
    event: ({ episodeNumber, input }) => ({
      type: "episode-interaction-changed",
      tmdbId,
      seasonNumber,
      episodeNumber,
      input,
    }),
  });

export const useMarkWatchedThrough = (tmdbId: number, seasonNumber: number) =>
  useMediaMutation({
    errorToast: "Couldn't mark those episodes watched",
    mutationFn: (episodeNumber: number) => markEpisodesWatchedThrough(tmdbId, seasonNumber, episodeNumber),
    event: (episodeNumber) => ({ type: "episodes-watched-through", tmdbId, seasonNumber, episodeNumber }),
  });
