import {
  getTrendingSeries as tmdbTrending,
  getOnAirSeries as tmdbOnAir,
  searchSeries as tmdbSearch,
  type TMDBSearchSeries,
} from "../../infrastructure/tmdb/serials";
import { SerialsArchiveService } from "./services/serials-archive.service";
import { SerialsActivityService } from "./services/serials-activity.service";
import { SerialsCacheService } from "./services/serials-cache.service";
import { SerialsDetailService } from "./services/serials-detail.service";
import { SerialsInteractionsRepository } from "./repositories/serials-interactions.repository";
import {
  SerialsCacheRepository,
  type AdminUpdateSeriesFields,
} from "./repositories/serials-cache.repository";
import type {
  NormalizedSerialArchiveQuery,
  CreateSerialLogDto,
  SerialDetailReviewSort,
  UpdateSerialInteractionDto,
  UpdateSerialLogDto,
} from "./dto/serials.dto";

export class SerialsService {
  static async search(query: string): Promise<TMDBSearchSeries[]> {
    return tmdbSearch(query);
  }

  static async getTrending() {
    const trendingSeries = await tmdbTrending("week");

    return trendingSeries.slice(0, 4).map((series) => {
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
    return SerialsCacheService.findOrCreate(tmdbId);
  }

  static async getArchive(input: {
    genre: NormalizedSerialArchiveQuery["genre"];
    language: NormalizedSerialArchiveQuery["language"];
    sort: NormalizedSerialArchiveQuery["sort"];
    period: NormalizedSerialArchiveQuery["period"];
    page: number;
    limit: number;
    viewerUserId?: string | null;
  }) {
    return SerialsArchiveService.getArchive(input);
  }

  static async getDetail(input: {
    tmdbId: number;
    viewerUserId?: string | null;
    reviewsSort: SerialDetailReviewSort;
  }) {
    return SerialsDetailService.getDetail(input);
  }

  static async getSeasonDetail(input: {
    tmdbId: number;
    seasonNumber: number;
    viewerUserId?: string | null;
  }) {
    return SerialsDetailService.getSeasonDetail(input);
  }

  static async getInteraction(userId: string, tmdbId: number) {
    return SerialsActivityService.getInteraction(userId, tmdbId);
  }

  static async updateInteraction(
    userId: string,
    tmdbId: number,
    input: UpdateSerialInteractionDto,
  ) {
    return SerialsActivityService.updateInteraction(userId, tmdbId, input);
  }

  static async createLog(userId: string, tmdbId: number, input: CreateSerialLogDto) {
    return SerialsActivityService.createLog(userId, tmdbId, input);
  }

  static async getMyLogs(userId: string, limit?: number, offset?: number) {
    return SerialsActivityService.getMyLogs(userId, limit, offset);
  }

  static async updateLog(entryId: string, userId: string, input: UpdateSerialLogDto) {
    return SerialsActivityService.updateLog(entryId, userId, input);
  }

  static async deleteLog(entryId: string, userId: string) {
    return SerialsActivityService.deleteLog(entryId, userId);
  }

  static async getLogs(tmdbId: number, limit?: number, offset?: number) {
    const series = await SerialsCacheService.findOrCreate(tmdbId);
    if (!series) return null;
    return SerialsActivityService.getLogs(series.id, limit, offset);
  }

  static async getRecent(): Promise<TMDBSearchSeries[]> {
    return tmdbOnAir();
  }

  static async getWatchedSeries(userId: string, limit?: number, offset?: number) {
    return SerialsInteractionsRepository.getWatchedSeriesForUser(userId, limit, offset);
  }

  static async listAllForAdmin(query: string | undefined, limit: number, offset: number) {
    return SerialsCacheRepository.listAllForAdmin(query, limit, offset);
  }

  static async updateForAdmin(id: number, fields: AdminUpdateSeriesFields) {
    return SerialsCacheRepository.updateById(id, fields);
  }

  static async refreshForAdmin(id: number) {
    const existing = await SerialsCacheRepository.findById(id);
    if (!existing) return null;
    return SerialsCacheService.refreshForAdmin(existing.tmdbId);
  }

  static async deleteForAdmin(id: number) {
    return SerialsCacheRepository.deleteById(id);
  }
}
