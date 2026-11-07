import { FilmsService } from "../films/films.service";
import type { AdminUpdateFilmFields } from "../films/repositories/films.repository";
import { TvService } from "../tv/tv.service";
import type { AdminUpdateSeriesFields } from "../tv/repositories/tv-cache.repository";

export class AdminMediaService {
  static async listMovies(query: string | undefined, limit: number, offset: number) {
    return FilmsService.listAllForAdmin(query, limit, offset);
  }

  static async updateMovie(id: number, fields: AdminUpdateFilmFields) {
    return FilmsService.updateForAdmin(id, fields);
  }

  static async refreshMovie(id: number) {
    return FilmsService.refreshForAdmin(id);
  }

  static async deleteMovie(id: number) {
    return FilmsService.deleteForAdmin(id);
  }

  static async listSerials(query: string | undefined, limit: number, offset: number) {
    return TvService.listAllForAdmin(query, limit, offset);
  }

  static async updateSerial(id: number, fields: AdminUpdateSeriesFields) {
    return TvService.updateForAdmin(id, fields);
  }

  static async refreshSerial(id: number) {
    return TvService.refreshForAdmin(id);
  }

  static async deleteSerial(id: number) {
    return TvService.deleteForAdmin(id);
  }
}
