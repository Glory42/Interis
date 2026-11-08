import type { CreateDiaryDto, DeleteDiaryQueryDto, UpdateDiaryDto } from "./dto/diary.dto";
import { DiaryRepository } from "./repositories/diary.repository";
import { filmWatchLog } from "./services/film-watch-log.adapter";
import { WatchLogService } from "../media/services/watch-log.service";
import { NotFoundError } from "../../commons/errors/app-error";

export class DiaryService {
  static async create(userId: string, input: CreateDiaryDto) {
    const { tmdbId, ...log } = input;
    const created = await WatchLogService.create(filmWatchLog, userId, tmdbId, log);
    if (!created) throw new NotFoundError("Movie not found");
    return created;
  }

  static async findAllByUser(userId: string, limit?: number, offset?: number) {
    return DiaryRepository.findAllByUser(userId, limit, offset);
  }

  static async update(entryId: string, userId: string, input: UpdateDiaryDto) {
    return WatchLogService.update(filmWatchLog, entryId, userId, input);
  }

  static async delete(entryId: string, userId: string, options: DeleteDiaryQueryDto = {}) {
    return WatchLogService.remove(filmWatchLog, entryId, { userId, unwatch: options.unwatch });
  }

  // No ownership check — admin moderation only.
  static async deleteById(entryId: string) {
    return WatchLogService.remove(filmWatchLog, entryId);
  }

  // Film rows keep their movieId / movieTitle keys for older admin clients.
  static async listAllForAdmin(
    filters: { userId?: string; movieId?: number },
    limit: number,
    offset: number,
  ) {
    const rows = await WatchLogService.listForAdmin(
      filmWatchLog,
      { userId: filters.userId, mediaId: filters.movieId },
      limit,
      offset,
    );
    return rows.map((row) => ({ ...row, movieId: row.mediaId, movieTitle: row.mediaTitle }));
  }
}
