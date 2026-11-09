import {
  getTrendingSeries as tmdbTrending,
  getOnAirSeries as tmdbOnAir,
  searchSeries as tmdbSearch,
  type TMDBSearchSeries,
} from "../../infrastructure/tmdb/tv";
import { TvArchiveService } from "./services/tv-archive.service";
import { TvActivityService } from "./services/tv-activity.service";
import { TvCacheService } from "./services/tv-cache.service";
import { TvDetailService } from "./services/tv-detail.service";
import { seriesWatchLog } from "./services/series-watch-log.adapter";
import { WatchLogService } from "../media/services/watch-log.service";
import { MediaInteractionService } from "../media-interactions/services/media-interaction.service";
import { seriesInteraction } from "./services/series-interaction.adapter";
import { TvInteractionsRepository } from "./repositories/tv-interactions.repository";
import { TvCacheRepository } from "./repositories/tv-cache.repository";
import type {
  NormalizedSeriesArchiveQuery,
  CreateSeriesLogDto,
  DeleteSeriesLogQueryDto,
  SeriesDetailReviewSort,
  UpdateSeriesInteractionDto,
  UpdateSeriesLogDto,
} from "./dto/tv.dto";

export class TvService {
  static async search(query: string): Promise<TMDBSearchSeries[]> {
    return tmdbSearch(query);
  }

  static async getTrending() {
    const trendingSeries = await tmdbTrending("week");

    return trendingSeries.slice(0, 9).map((series) => {
      const firstAirYear = series.first_air_date
        ? Number.parseInt(series.first_air_date.slice(0, 4), 10)
        : Number.NaN;

      return {
        tmdbId: series.id,
        title: series.name,
        posterPath: series.poster_path,
        firstAirYear: Number.isNaN(firstAirYear) ? null : firstAirYear,
      };
    });
  }

  static async findOrCreate(tmdbId: number) {
    return TvCacheService.findOrCreate(tmdbId);
  }

  static async findForRead(tmdbId: number) {
    return TvCacheService.findForRead(tmdbId);
  }

  static async getArchive(input: {
    genre: NormalizedSeriesArchiveQuery["genre"];
    language: NormalizedSeriesArchiveQuery["language"];
    sort: NormalizedSeriesArchiveQuery["sort"];
    period: NormalizedSeriesArchiveQuery["period"];
    page: number;
    limit: number;
    viewerUserId?: string | null;
  }) {
    return TvArchiveService.getArchive(input);
  }

  static async getDetail(input: {
    tmdbId: number;
    viewerUserId?: string | null;
    reviewsSort: SeriesDetailReviewSort;
    reviewsPage: number;
    reviewsLimit: number;
  }) {
    return TvDetailService.getDetail(input);
  }

  static async getReviews(input: {
    tmdbId: number;
    viewerUserId?: string | null;
    sort: SeriesDetailReviewSort;
    page: number;
    limit: number;
  }) {
    return TvDetailService.getReviews(input);
  }

  static async getSeasonDetail(input: {
    tmdbId: number;
    seasonNumber: number;
    viewerUserId?: string | null;
  }) {
    return TvDetailService.getSeasonDetail(input);
  }

  static async getInteraction(userId: string, tmdbId: number) {
    return MediaInteractionService.get(seriesInteraction, userId, tmdbId);
  }

  static async updateInteraction(
    userId: string,
    tmdbId: number,
    input: UpdateSeriesInteractionDto,
  ) {
    return MediaInteractionService.update(seriesInteraction, userId, tmdbId, input);
  }

  static async createLog(userId: string, tmdbId: number, input: CreateSeriesLogDto) {
    return WatchLogService.create(seriesWatchLog, userId, tmdbId, input);
  }

  static async getMyLogs(userId: string, limit?: number, offset?: number) {
    return TvActivityService.getMyLogs(userId, limit, offset);
  }

  static async updateLog(entryId: string, userId: string, input: UpdateSeriesLogDto) {
    return WatchLogService.update(seriesWatchLog, entryId, userId, input);
  }

  static async deleteLog(entryId: string, userId: string, options: DeleteSeriesLogQueryDto = {}) {
    return WatchLogService.remove(seriesWatchLog, entryId, { userId, unwatch: options.unwatch });
  }

  // No ownership check — admin moderation only.
  static async deleteLogById(entryId: string) {
    return WatchLogService.remove(seriesWatchLog, entryId);
  }

  static async listLogsForAdmin(
    filters: { userId?: string; seriesId?: number },
    limit: number,
    offset: number,
  ) {
    return WatchLogService.listForAdmin(
      seriesWatchLog,
      { userId: filters.userId, mediaId: filters.seriesId },
      limit,
      offset,
    );
  }

  static async getLogs(tmdbId: number, limit?: number, offset?: number) {
    const series = await TvCacheService.findForRead(tmdbId);
    if (!series) return null;
    return TvActivityService.getLogs(series.id, limit, offset);
  }

  static async getRecent(): Promise<TMDBSearchSeries[]> {
    return tmdbOnAir();
  }

  static async getWatchedSeries(userId: string, limit?: number, offset?: number) {
    return TvInteractionsRepository.getWatchedSeriesForUser(userId, limit, offset);
  }

  static async findCachedCreators(tmdbIds: number[]): Promise<Map<number, string>> {
    const rows = await TvCacheRepository.findCreatorsByTmdbIds(tmdbIds);
    return new Map(rows.flatMap((row) => (row.creator ? [[row.tmdbId, row.creator] as const] : [])));
  }
}
