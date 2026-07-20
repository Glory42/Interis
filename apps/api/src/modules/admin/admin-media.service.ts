import { MoviesService } from "../movies/movies.service";
import type { AdminUpdateMovieFields } from "../movies/repositories/movies.repository";
import { SerialsService } from "../serials/serials.service";
import type { AdminUpdateSeriesFields } from "../serials/repositories/serials-cache.repository";

export class AdminMediaService {
  static async listMovies(query: string | undefined, limit: number, offset: number) {
    return MoviesService.listAllForAdmin(query, limit, offset);
  }

  static async updateMovie(id: number, fields: AdminUpdateMovieFields) {
    return MoviesService.updateForAdmin(id, fields);
  }

  static async refreshMovie(id: number) {
    return MoviesService.refreshForAdmin(id);
  }

  static async deleteMovie(id: number) {
    return MoviesService.deleteForAdmin(id);
  }

  static async listSerials(query: string | undefined, limit: number, offset: number) {
    return SerialsService.listAllForAdmin(query, limit, offset);
  }

  static async updateSerial(id: number, fields: AdminUpdateSeriesFields) {
    return SerialsService.updateForAdmin(id, fields);
  }

  static async refreshSerial(id: number) {
    return SerialsService.refreshForAdmin(id);
  }

  static async deleteSerial(id: number) {
    return SerialsService.deleteForAdmin(id);
  }
}
