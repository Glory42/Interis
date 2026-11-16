import type { TMDBSeriesDetail, TMDBSeriesSeasonDetail } from "../../../infrastructure/tmdb/tv";
import { isNonSpecialSeasonNumber } from "../constants/tv-season.constants";

export type EpisodePosition = { seasonNumber: number; episodeNumber: number };
export type TmdbSeasonEpisode = TMDBSeriesSeasonDetail["episodes"][number];

// Calendar days are "YYYY-MM-DD" strings throughout, so they compare as strings.
export const addDays = (day: string, days: number): string => {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export const hasAired = (airDate: string | null, today: string): boolean =>
  airDate !== null && airDate !== "" && airDate <= today;

export const isAfterPosition = (episode: EpisodePosition, furthest: EpisodePosition | null): boolean =>
  furthest === null ||
  episode.seasonNumber > furthest.seasonNumber ||
  (episode.seasonNumber === furthest.seasonNumber && episode.episodeNumber > furthest.episodeNumber);

const regularSeasons = (detail: TMDBSeriesDetail) =>
  detail.seasons
    .filter((season) => isNonSpecialSeasonNumber(season.season_number) && (season.episode_count ?? 0) > 0)
    .sort((left, right) => left.season_number - right.season_number);

// Which seasons to open, in order, to find the episode after `furthest` (specials never count).
// At most two: the rest of the furthest season, then the start of the next one.
export const planNextEpisodeLookup = (
  detail: TMDBSeriesDetail,
  furthest: EpisodePosition | null,
): { seasonNumber: number; after: number }[] => {
  const steps: { seasonNumber: number; after: number }[] = [];
  for (const season of regularSeasons(detail)) {
    if (furthest && season.season_number < furthest.seasonNumber) continue;
    const isFurthestSeason = furthest?.seasonNumber === season.season_number;
    const after = isFurthestSeason ? furthest.episodeNumber : 0;
    if (isFurthestSeason && after >= (season.episode_count ?? 0)) continue;
    steps.push({ seasonNumber: season.season_number, after });
    if (steps.length === 2) break;
  }
  return steps;
};

export const pickEpisodeAfter = (season: TMDBSeriesSeasonDetail, after: number): TmdbSeasonEpisode | null =>
  [...season.episodes]
    .sort((left, right) => left.episode_number - right.episode_number)
    .find((episode) => episode.episode_number > after) ?? null;

// Aired episodes from `next` onwards that premiered after the viewer's last watch: the rest of
// next's season from its episode list, later seasons from the series' own counts.
export const countNewEpisodesSince = (input: {
  detail: TMDBSeriesDetail;
  season: TMDBSeriesSeasonDetail;
  next: EpisodePosition;
  lastWatchedDay: string;
  today: string;
}): number => {
  const { detail, season, next, lastWatchedDay, today } = input;
  const isNew = (airDate: string | null) => hasAired(airDate, today) && (airDate ?? "") > lastWatchedDay;

  let count = season.episodes.filter(
    (episode) => episode.episode_number >= next.episodeNumber && isNew(episode.air_date),
  ).length;

  const lastAired = detail.last_episode_to_air;
  if (!lastAired) return count;
  for (const later of regularSeasons(detail)) {
    if (later.season_number <= next.seasonNumber || later.season_number > lastAired.season_number) continue;
    if (!isNew(later.air_date)) continue;
    count += later.season_number === lastAired.season_number ? lastAired.episode_number : (later.episode_count ?? 0);
  }
  return count;
};
