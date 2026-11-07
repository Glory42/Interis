import { FilmsService } from "../../films/films.service";
import { InteractionsService } from "../../interactions/interactions.service";
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
  prepareMarkWatched: async (movie) => (userId) => InteractionsService.setWatched(userId, movie.id),
  unwatch: (userId, movieId) => InteractionsService.setUnwatched(userId, movieId),
  activitySubject: (movie) => ({ kind: "movie", movie }),
  toEntry: ({ mediaId, ...row }) => ({ ...row, movieId: mediaId }),
  toCreated: ({ entry, title, review }) => ({ entry, movie: title, review }),
};
