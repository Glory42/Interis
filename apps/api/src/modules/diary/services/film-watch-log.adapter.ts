import { FilmsService } from "../../films/films.service";
import { MediaInteractionService } from "../../media-interactions/services/media-interaction.service";
import { WatchLogStores } from "../../media/repositories/watch-log.repository";
import type { AttachedReview, WatchLogAdapter, WatchLogRow } from "../../media/types/watch-log.types";

type Film = Awaited<ReturnType<typeof FilmsService.findOrCreate>>;
type FilmLogEntry = Omit<WatchLogRow, "mediaId"> & { movieId: number };

// The Film side of the Watch Log module.
export const filmWatchLog: WatchLogAdapter<
  Film,
  FilmLogEntry,
  { entry: FilmLogEntry; movie: Film; review: AttachedReview | null }
> = {
  mediaType: "movie",
  store: WatchLogStores.film,
  findOrCreateTitle: async (tmdbId) => {
    const movie = await FilmsService.findOrCreate(tmdbId);
    return movie?.id ? movie : null;
  },
  prepareMarkWatched: async (movie) => (userId) =>
    MediaInteractionService.setWatched("movie", userId, movie.id, true),
  unwatch: (userId, movieId) => MediaInteractionService.setWatched("movie", userId, movieId, false),
  activitySubject: (movie) => ({ kind: "movie", movie }),
  toEntry: ({ mediaId, ...row }) => ({ ...row, movieId: mediaId }),
  toCreated: ({ entry, title, review }) => ({ entry, movie: title, review }),
};
