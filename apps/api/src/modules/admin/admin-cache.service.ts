import { memoryCacheCounters } from "../../infrastructure/cache/ttl-cache.helper";
import { logger } from "../../commons/utils/logger";
import { AuthService } from "../auth/auth.service";
import { AdminAuditService, type AuditActor } from "./admin-audit.service";
import { AdminMediaService } from "./admin-media.service";
import { AdminCacheRepository, type CacheKind } from "./repositories/admin-cache.repository";

const REFRESH_COUNT = 25;
const REFRESH_CONCURRENCY = 5;
const PURGE_BATCH_SIZE = 500;
const PURGE_MAX_BATCHES = 200;

const refreshOne = async (kind: CacheKind, id: number): Promise<boolean> => {
  try {
    return (await AdminMediaService.refreshUnaudited(kind, id)) !== null;
  } catch (error) {
    logger.warn({ err: error, kind, id }, "Cache refresh failed");
    return false;
  }
};

export class AdminCacheService {
  static async summary() {
    const [movie, serial] = await Promise.all([
      AdminCacheRepository.countTitles("movie"),
      AdminCacheRepository.countTitles("serial"),
    ]);
    return {
      startedAt: memoryCacheCounters.startedAt.toISOString(),
      memory: { hits: memoryCacheCounters.hits, misses: memoryCacheCounters.misses },
      titles: { movies: movie.total, serials: serial.total },
      unreferenced: { movies: movie.unreferenced, serials: serial.unreferenced },
    };
  }

  // A few at a time so 25 TMDB calls don't land at once.
  static async refreshOldest(kind: CacheKind, actor: AuditActor) {
    const oldest = await AdminCacheRepository.oldestIds(kind, REFRESH_COUNT);
    const titles: { id: number; title: string; ok: boolean }[] = [];
    for (let start = 0; start < oldest.length; start += REFRESH_CONCURRENCY) {
      const chunk = oldest.slice(start, start + REFRESH_CONCURRENCY);
      const results = await Promise.all(chunk.map((row) => refreshOne(kind, row.id)));
      chunk.forEach((row, index) => titles.push({ ...row, ok: results[index] ?? false }));
    }
    await AdminAuditService.record(actor, {
      action: "cache.refresh_oldest",
      targetType: kind,
      targetId: "oldest",
      targetLabel: `${titles.filter((title) => title.ok).length} of ${titles.length} refreshed`,
    });
    return { titles };
  }

  static async purgeUnreferenced(actor: AuditActor, adminPassword: string | undefined) {
    await AuthService.assertCurrentPassword(actor.id, adminPassword);
    const purgeKind = async (kind: CacheKind) => {
      let deleted = 0;
      for (let batch = 0; batch < PURGE_MAX_BATCHES; batch += 1) {
        const result = await AdminCacheRepository.deleteUnreferencedBatch(kind, PURGE_BATCH_SIZE);
        deleted += result.deleted;
        if (result.scanned < PURGE_BATCH_SIZE) break;
      }
      return deleted;
    };
    const purged = { movies: await purgeKind("movie"), serials: await purgeKind("serial") };
    await AdminAuditService.record(actor, {
      action: "cache.purge",
      targetType: "cache",
      targetId: "unreferenced",
      targetLabel: `${purged.movies} films, ${purged.serials} series`,
    });
    return purged;
  }
}
