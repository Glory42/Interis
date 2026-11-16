import {
  getSeriesDetails as tmdbGetDetails,
  getSeriesSeasonDetails as tmdbGetSeasonDetails,
  type TMDBSeriesDetail,
} from "../../../infrastructure/tmdb/tv";
import { mapWithConcurrency } from "../../../commons/utils/map-with-concurrency";
import { logger } from "../../../commons/utils/logger";
import { toDayKey } from "../../social/helpers/feed-day.helper";
import { TvUpNextRepository, type UpNextCandidateRow } from "../repositories/tv-up-next.repository";
import {
  addDays,
  countNewEpisodesSince,
  hasAired,
  isAfterPosition,
  pickEpisodeAfter,
  planNextEpisodeLookup,
  type TmdbSeasonEpisode,
} from "../helpers/tv-up-next.helper";
import { isNonSpecialSeasonNumber } from "../constants/tv-season.constants";
import type { AiringSoonEpisode, UpNextEpisode, UpNextItem, UpNextResponse, UpNextSeries } from "../types/tv-up-next.types";

// Bounds the TMDB fan-out: at most this many series, this many in flight at once.
export const UP_NEXT_SERIES_LIMIT = 30;
const TMDB_CONCURRENCY = 6;
export const AIRING_SOON_DAYS = 14;

type SeriesResult = { upNext: UpNextItem | null; airingSoon: AiringSoonEpisode[] };

const toEpisode = (episode: TmdbSeasonEpisode, detail: TMDBSeriesDetail): UpNextEpisode => ({
  seasonNumber: episode.season_number,
  episodeNumber: episode.episode_number,
  name: episode.name || `Episode ${episode.episode_number}`,
  stillPath: episode.still_path,
  airDate: episode.air_date || null,
  runtime: episode.runtime ?? detail.episode_run_time[0] ?? null,
});

export class TvUpNextService {
  // "What do I watch next?": the next aired episode of every Series the viewer is watching, and
  // what airs in the next two weeks. Reads only; one DB query, TMDB through the cached fetchers.
  static async getUpNext(userId: string, timeZone: string, now = new Date()): Promise<UpNextResponse> {
    const today = toDayKey(now, timeZone);
    const candidates = await TvUpNextRepository.getCandidates(userId, UP_NEXT_SERIES_LIMIT);

    const results = await mapWithConcurrency(candidates, TMDB_CONCURRENCY, (candidate) =>
      TvUpNextService.resolveSeries(candidate, today, timeZone).catch((error: unknown) => {
        // One failing series drops its row, not the page.
        logger.warn({ err: error, tmdbId: candidate.tmdbId }, "up next: skipped a series");
        return null;
      }),
    );

    const upNext: UpNextItem[] = [];
    const airingByDate = new Map<string, AiringSoonEpisode[]>();
    for (const result of results) {
      if (!result) continue;
      if (result.upNext) upNext.push(result.upNext);
      for (const entry of result.airingSoon) {
        const date = entry.episode.airDate ?? today;
        airingByDate.set(date, [...(airingByDate.get(date) ?? []), entry]);
      }
    }

    const airingSoon = [...airingByDate.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, episodes]) => ({ date, episodes }));

    return { today, upNext, airingSoon };
  }

  private static async resolveSeries(
    candidate: UpNextCandidateRow,
    today: string,
    timeZone: string,
  ): Promise<SeriesResult> {
    const detail = await tmdbGetDetails(candidate.tmdbId);
    const series: UpNextSeries = {
      tmdbId: candidate.tmdbId,
      title: candidate.title,
      posterPath: candidate.posterPath ?? detail.poster_path,
      backdropPath: candidate.backdropPath ?? detail.backdrop_path,
    };
    const furthest =
      candidate.furthestSeasonNumber !== null && candidate.furthestEpisodeNumber !== null
        ? { seasonNumber: candidate.furthestSeasonNumber, episodeNumber: candidate.furthestEpisodeNumber }
        : null;

    const upNext = candidate.isWatching ? await TvUpNextService.resolveNextEpisode(candidate, detail, series, furthest, today, timeZone) : null;

    const windowEnd = addDays(today, AIRING_SOON_DAYS);
    const inWindow = (airDate: string | null) => airDate !== null && airDate >= today && airDate <= windowEnd;
    const nextToAir = detail.next_episode_to_air;
    if (!nextToAir || !isNonSpecialSeasonNumber(nextToAir.season_number) || !inWindow(nextToAir.air_date)) {
      return { upNext, airingSoon: [] };
    }

    const season = await tmdbGetSeasonDetails(candidate.tmdbId, nextToAir.season_number);
    const isUpNext = (episode: TmdbSeasonEpisode) =>
      upNext?.episode.seasonNumber === episode.season_number && upNext.episode.episodeNumber === episode.episode_number;
    const airingSoon = season.episodes
      .filter(
        (episode) =>
          inWindow(episode.air_date) &&
          !isUpNext(episode) &&
          isAfterPosition({ seasonNumber: episode.season_number, episodeNumber: episode.episode_number }, furthest),
      )
      .map((episode) => ({
        series,
        episode: toEpisode(episode, detail),
        source: candidate.isWatching ? ("watching" as const) : ("watchlist" as const),
      }));

    return { upNext, airingSoon };
  }

  private static async resolveNextEpisode(
    candidate: UpNextCandidateRow,
    detail: TMDBSeriesDetail,
    series: UpNextSeries,
    furthest: { seasonNumber: number; episodeNumber: number } | null,
    today: string,
    timeZone: string,
  ): Promise<UpNextItem | null> {
    for (const step of planNextEpisodeLookup(detail, furthest)) {
      const season = await tmdbGetSeasonDetails(candidate.tmdbId, step.seasonNumber);
      const episode = pickEpisodeAfter(season, step.after);
      if (!episode) continue;
      // Caught up: the next episode hasn't aired yet, so it belongs to Airing soon.
      if (!hasAired(episode.air_date, today)) return null;

      const next = { seasonNumber: episode.season_number, episodeNumber: episode.episode_number };
      return {
        series,
        episode: toEpisode(episode, detail),
        seasonEpisodeCount: season.episodes.length || null,
        watchedEpisodesCount: candidate.watchedEpisodesCount,
        numberOfEpisodes: detail.number_of_episodes ?? candidate.numberOfEpisodes,
        lastWatchedAt: candidate.lastWatchedAt?.toISOString() ?? null,
        newEpisodesCount: candidate.lastWatchedAt
          ? countNewEpisodesSince({
              detail,
              season,
              next,
              lastWatchedDay: toDayKey(candidate.lastWatchedAt, timeZone),
              today,
            })
          : 0,
      };
    }
    return null;
  }
}
