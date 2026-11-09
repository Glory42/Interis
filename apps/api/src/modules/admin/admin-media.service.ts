import { FilmsRepository, type AdminUpdateFilmFields } from "../films/repositories/films.repository";
import { FilmsCacheService } from "../films/services/films-cache.service";
import { TvCacheRepository, type AdminUpdateSeriesFields } from "../tv/repositories/tv-cache.repository";
import { TvCacheService } from "../tv/services/tv-cache.service";
import { AdminAuditService, type AuditActor } from "./admin-audit.service";

// Wire names: the audit log and cache tools call Films "movie" and Series "serial".
export type AdminMediaKind = "movie" | "serial";

export type AdminMediaFields = { movie: AdminUpdateFilmFields; serial: AdminUpdateSeriesFields };

type CachedTitles<K extends AdminMediaKind> = {
  list: (query: string | undefined, limit: number, offset: number) => Promise<object[]>;
  findById: (id: number) => Promise<{ tmdbId: number } | null>;
  update: (id: number, fields: AdminMediaFields[K]) => Promise<object | null>;
  refreshFromTmdb: (tmdbId: number) => Promise<object | null>;
  remove: (id: number) => Promise<object | null>;
};

const catalog: { [K in AdminMediaKind]: CachedTitles<K> } = {
  movie: {
    list: (query, limit, offset) => FilmsRepository.listAllForAdmin(query, limit, offset),
    findById: (id) => FilmsRepository.findById(id),
    update: (id, fields) => FilmsRepository.updateById(id, fields),
    refreshFromTmdb: (tmdbId) => FilmsCacheService.refreshForAdmin(tmdbId),
    remove: (id) => FilmsRepository.deleteById(id),
  },
  serial: {
    list: (query, limit, offset) => TvCacheRepository.listAllForAdmin(query, limit, offset),
    findById: (id) => TvCacheRepository.findById(id),
    update: (id, fields) => TvCacheRepository.updateById(id, fields),
    refreshFromTmdb: (tmdbId) => TvCacheService.refreshForAdmin(tmdbId),
    remove: (id) => TvCacheRepository.deleteById(id),
  },
};

const audit = (actor: AuditActor, kind: AdminMediaKind, verb: string, id: number) =>
  AdminAuditService.record(actor, { action: `${kind}.${verb}`, targetType: kind, targetId: String(id) });

// Admin edits to cached Film and Series rows; each change writes its audit entry.
export class AdminMediaService {
  static async list(kind: AdminMediaKind, query: string | undefined, limit: number, offset: number) {
    return catalog[kind].list(query, limit, offset);
  }

  static async update<K extends AdminMediaKind>(kind: K, id: number, fields: AdminMediaFields[K], actor: AuditActor) {
    const updated = await catalog[kind].update(id, fields);
    if (updated) await audit(actor, kind, "update", id);
    return updated;
  }

  static async refresh(kind: AdminMediaKind, id: number, actor: AuditActor) {
    const refreshed = await AdminMediaService.refreshUnaudited(kind, id);
    if (refreshed) await audit(actor, kind, "refresh", id);
    return refreshed;
  }

  // For bulk refreshes that write one audit entry for the whole batch.
  static async refreshUnaudited(kind: AdminMediaKind, id: number) {
    const existing = await catalog[kind].findById(id);
    return existing ? catalog[kind].refreshFromTmdb(existing.tmdbId) : null;
  }

  static async remove(kind: AdminMediaKind, id: number, actor: AuditActor): Promise<boolean> {
    const removed = await catalog[kind].remove(id);
    if (removed) await audit(actor, kind, "delete", id);
    return removed !== null;
  }
}
