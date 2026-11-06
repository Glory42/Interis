import type { ViewerStatus, ViewerStatusItem } from "./dto/viewer-status.dto";
import { ViewerStatusRepository } from "./repositories/viewer-status.repository";

const emptyStatus = (item: ViewerStatusItem): ViewerStatus => ({
  ...item,
  watched: false,
  rating: null,
  liked: false,
  watchlisted: false,
  episodes: null,
});

export class ViewerStatusService {
  static async getStatuses(
    viewerUserId: string | null,
    items: ViewerStatusItem[],
  ): Promise<ViewerStatus[]> {
    if (!viewerUserId) {
      return items.map(emptyStatus);
    }

    const movieIds = items.filter((item) => item.mediaType === "movie").map((item) => item.tmdbId);
    const seriesIds = items.filter((item) => item.mediaType === "tv").map((item) => item.tmdbId);

    const [movieRows, seriesRows, episodeRows] = await Promise.all([
      movieIds.length > 0 ? ViewerStatusRepository.findMovieStatuses(viewerUserId, movieIds) : [],
      seriesIds.length > 0 ? ViewerStatusRepository.findSeriesStatuses(viewerUserId, seriesIds) : [],
      seriesIds.length > 0 ? ViewerStatusRepository.countWatchedEpisodes(viewerUserId, seriesIds) : [],
    ]);

    const moviesById = new Map(movieRows.map((row) => [row.tmdbId, row]));
    const seriesById = new Map(seriesRows.map((row) => [row.tmdbId, row]));
    const episodesById = new Map(episodeRows.map((row) => [row.tmdbId, row.watched]));

    return items.map((item) => {
      if (item.mediaType === "movie") {
        const row = moviesById.get(item.tmdbId);
        return row
          ? { ...emptyStatus(item), watched: row.watched, rating: row.rating, liked: row.liked, watchlisted: row.watchlisted }
          : emptyStatus(item);
      }

      const row = seriesById.get(item.tmdbId);
      if (!row) {
        return emptyStatus(item);
      }

      return {
        ...item,
        watched: row.watchStatus === "completed",
        rating: row.rating ?? null,
        liked: row.liked ?? false,
        watchlisted: row.watchlisted ?? false,
        episodes: { watched: episodesById.get(item.tmdbId) ?? 0, total: row.totalEpisodes },
      };
    });
  }
}
