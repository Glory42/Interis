import { isNonSpecialSeasonNumber } from "../constants/serials-season.constants";

type EpisodeInteraction = { watched: boolean; seasonNumber: number; episodeNumber: number };

/** Filters out season 0 (Specials) and unwatched episodes, returning the real watched set. */
export const filterWatchedNonSpecialEpisodes = (
  interactions: EpisodeInteraction[],
): EpisodeInteraction[] =>
  interactions.filter((i) => i.watched && isNonSpecialSeasonNumber(i.seasonNumber));

/** Returns a Set of "seasonNumber:episodeNumber" keys for fast lookup. */
export const toWatchedEpisodeKeySet = (interactions: EpisodeInteraction[]): Set<string> =>
  new Set(
    filterWatchedNonSpecialEpisodes(interactions).map(
      (i) => `${i.seasonNumber}:${i.episodeNumber}`,
    ),
  );
