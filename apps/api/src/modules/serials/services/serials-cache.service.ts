import { getSeriesDetails, type TMDBSeriesDetail } from "../../../infrastructure/tmdb/serials";
import { normalizeTmdbSeriesDetail } from "../helpers/serials-normalization.helper";
import { SerialsCacheRepository } from "../repositories/serials-cache.repository";

export class SerialsCacheService {
  static async findOrCreate(tmdbId: number) {
    const existing = await SerialsCacheRepository.findByTmdbId(tmdbId);
    if (existing) {
      return existing;
    }

    const tmdbData = await getSeriesDetails(tmdbId);
    const cachedSeries = await SerialsCacheService.cacheSeries(tmdbData);

    if (!cachedSeries) {
      throw new Error(`Failed to cache series for tmdbId=${tmdbId}`);
    }

    return cachedSeries;
  }

  static async cacheSeries(tmdbData: TMDBSeriesDetail) {
    const normalized = normalizeTmdbSeriesDetail(tmdbData);

    return SerialsCacheRepository.upsertCachedSeries(normalized);
  }
}
