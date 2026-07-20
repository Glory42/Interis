import { getSeriesDetails, type TMDBSeriesDetail } from "../../../infrastructure/tmdb/serials";
import { normalizeTmdbSeriesDetail } from "../helpers/serials-normalization.helper";
import { SerialsCacheRepository } from "../repositories/serials-cache.repository";
import { NotFoundError } from "../../../commons/errors/app-error";

// Cached series rows (season/episode counts, status, etc.) go stale for
// still-airing shows once TMDB publishes a new season - without a refresh,
// a "fully watched" check against a season/episode count cached before that
// new season existed can false-positive (see updateSeasonInteraction /
// getInteraction, which compare watched-episode totals against this cached
// count). Ended/canceled shows won't drift, but re-checking them every 6h
// on next view is cheap enough not to bother special-casing status.
const SERIES_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const isStale = (cachedAt: Date): boolean => {
  return Date.now() - cachedAt.getTime() > SERIES_CACHE_TTL_MS;
};

export class SerialsCacheService {
  static async findOrCreate(tmdbId: number) {
    const existing = await SerialsCacheRepository.findByTmdbId(tmdbId);
    if (existing && !isStale(existing.cachedAt)) {
      return existing;
    }

    const tmdbData = await getSeriesDetails(tmdbId).catch(() => null);
    const cachedSeries = tmdbData ? await SerialsCacheService.cacheSeries(tmdbData) : null;

    if (cachedSeries) {
      return cachedSeries;
    }

    if (existing) {
      return existing;
    }

    throw new NotFoundError("Series not found");
  }

  static async cacheSeries(tmdbData: TMDBSeriesDetail) {
    const normalized = normalizeTmdbSeriesDetail(tmdbData);

    return SerialsCacheRepository.upsertCachedSeries(normalized);
  }
}
