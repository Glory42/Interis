import type { SeriesWatchStatus } from "@/features/tv/api";
import type { InteractionInput, MediaKind } from "./media-events";

export type InteractionState = {
  liked: boolean;
  watchlisted: boolean;
  rating: number | null;
  watched: boolean;
  watchStatus?: SeriesWatchStatus | null;
};

// Liking or rating a Film or an episode is an implicit "I've watched this" (API deriveImplicitWatched).
export const isImplicitlyWatched = (input: { liked?: boolean; rating?: number | null }): boolean =>
  input.liked === true || (input.rating !== undefined && input.rating !== null);

// Client mirror of the API's resolveInteractionUpdate, so the optimistic state matches the saved row.
export const resolveInteraction = <T extends InteractionState>(kind: MediaKind, previous: T, input: InteractionInput): T => {
  const implicitlyWatched = isImplicitlyWatched(input);
  // Liking, rating or watching takes the title off the Watchlist, unless the write set watchlisted itself.
  const clearsWatchlist =
    input.watchlisted === undefined && (input.liked === true || input.watched === true || implicitlyWatched);
  const next: T = {
    ...previous,
    liked: input.liked ?? previous.liked,
    watchlisted: input.watchlisted ?? (clearsWatchlist ? false : previous.watchlisted),
    rating: input.rating !== undefined ? input.rating : previous.rating,
  };

  if (kind === "film") {
    return { ...next, watched: implicitlyWatched || (input.watched ?? previous.watched) };
  }
  // A Series' watched is its watch status; liking or rating it says nothing about episodes (#66).
  if (input.watched !== undefined) {
    return { ...next, watched: input.watched, watchStatus: input.watched ? "completed" : null };
  }
  return input.watchStatus !== undefined ? { ...next, watchStatus: input.watchStatus } : next;
};
