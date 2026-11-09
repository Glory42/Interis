import { FilmsService } from "../../films/films.service";
import type { InteractionStateRow } from "../../media-interactions/helpers/interaction-state-rules.helper";
import type { MediaInteractionAdapter } from "../../media-interactions/types/media-interaction.types";
import type { UpdateInteractionDto } from "../dto/interactions.dto";

type Film = Awaited<ReturnType<typeof FilmsService.findOrCreate>>;

export type FilmInteractionState = {
  liked: boolean;
  watchlisted: boolean;
  rating: number | null;
  watched: boolean;
};

const toState = (row: InteractionStateRow | null): FilmInteractionState => ({
  liked: row?.liked ?? false,
  watchlisted: row?.watchlisted ?? false,
  rating: row?.rating ?? null,
  watched: row?.isWatched ?? false,
});

// The Film side of the Interaction module: watched is a column, so no cascade.
export const filmInteraction: MediaInteractionAdapter<
  "movie",
  Film,
  UpdateInteractionDto,
  FilmInteractionState
> = {
  mediaType: "movie",
  findOrCreateMedia: (tmdbId) => FilmsService.findOrCreate(tmdbId),
  activitySubject: (movie) => ({ kind: "movie", movie }),
  toState,
};
