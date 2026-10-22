import { getSeriesDetails } from "../../../infrastructure/tmdb/serials";
import { normalizeTmdbSeriesDetail } from "../helpers/serials-normalization.helper";
import { SerialsCacheRepository } from "../repositories/serials-cache.repository";
import { NotFoundError } from "../../../commons/errors/app-error";
import { hasCachedMediaChanged } from "../../media/helpers/media-cache-diff.helper";
import { UNSAVED_MEDIA_ID } from "../../media/constants/unsaved-media.constants";
import { SerialsWatchStatusService } from "./serials-watch-status.service";

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
    const cachedSeries = tmdbData
      ? await SerialsCacheService.persist(normalizeTmdbSeriesDetail(tmdbData), existing)
      : null;

    if (cachedSeries) {
      return cachedSeries;
    }

    if (existing) {
      return existing;
    }

    throw new NotFoundError("Series not found");
  }

  // Cached row only, no TMDB fetch - for checks where an uncached series can't match anything.
  static async findCached(tmdbId: number) {
    return SerialsCacheRepository.findByTmdbId(tmdbId);
  }

  // Read-path variant: never inserts. An uncached series is returned as an unsaved row
  // (id = UNSAVED_MEDIA_ID) - it only gets a DB row once someone logs/reviews/tracks it.
  // A stale cached row is rewritten only if TMDB data actually changed.
  static async findForRead(tmdbId: number) {
    const existing = await SerialsCacheRepository.findByTmdbId(tmdbId);
    if (existing && !isStale(existing.cachedAt)) {
      return existing;
    }

    const tmdbData = await getSeriesDetails(tmdbId).catch(() => null);
    if (!tmdbData) {
      if (existing) {
        return existing;
      }
      throw new NotFoundError("Series not found");
    }

    const values = normalizeTmdbSeriesDetail(tmdbData);
    if (!existing) {
      return { ...values, id: UNSAVED_MEDIA_ID, cachedAt: new Date() };
    }

    if (!hasCachedMediaChanged(existing, values)) {
      return existing;
    }

    return (await SerialsCacheService.persist(values, existing)) ?? existing;
  }

  // Bypasses the TTL check above — always refetches from TMDB.
  static async refreshForAdmin(tmdbId: number) {
    const [existing, tmdbData] = await Promise.all([
      SerialsCacheRepository.findByTmdbId(tmdbId),
      getSeriesDetails(tmdbId),
    ]);
    return SerialsCacheService.persist(normalizeTmdbSeriesDetail(tmdbData), existing);
  }

  // Writes the refreshed row and, when TMDB now lists more episodes than the
  // cached row did, moves viewers who had finished it back to "watching".
  private static async persist(
    values: ReturnType<typeof normalizeTmdbSeriesDetail>,
    existing: Awaited<ReturnType<typeof SerialsCacheRepository.findByTmdbId>>,
  ) {
    const saved = await SerialsCacheRepository.upsertCachedSeries(values);
    if (saved && existing) {
      await SerialsWatchStatusService.reopenAfterNewEpisodes(
        saved.id,
        existing.numberOfEpisodes,
        saved.numberOfEpisodes,
      );
    }
    return saved;
  }
}
