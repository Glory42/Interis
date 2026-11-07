import { deriveImplicitWatched } from "../../media-interactions/helpers/interaction-state-rules.helper";

type EpisodeWatchState = {
  watched: boolean;
  watchedImplicitly: boolean;
  liked: boolean;
  rating: number | null;
};

// What an episode write does to its watched state. An explicit `watched`
// always wins. Otherwise liking / rating an unwatched episode marks it
// watched implicitly, and once neither a like nor a rating is left, an
// implicit watch is taken back. Returns undefined when watched is untouched.
export function resolveEpisodeWatchedUpdate(
  previous: EpisodeWatchState | null,
  input: { watched?: boolean; liked?: boolean; rating?: number | null },
): { watched: boolean; watchedImplicitly: boolean } | undefined {
  if (input.watched !== undefined) {
    return { watched: input.watched, watchedImplicitly: false };
  }

  if (!previous?.watched) {
    return deriveImplicitWatched(input) ? { watched: true, watchedImplicitly: true } : undefined;
  }

  const nextLiked = input.liked ?? previous.liked;
  const nextRating = input.rating !== undefined ? input.rating : previous.rating;
  if (previous.watchedImplicitly && !nextLiked && nextRating === null) {
    return { watched: false, watchedImplicitly: false };
  }

  return undefined;
}
