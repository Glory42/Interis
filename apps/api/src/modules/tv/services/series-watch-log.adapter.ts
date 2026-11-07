import { WatchLogStores } from "../../media/repositories/watch-log.repository";
import type { AttachedReview, WatchLogAdapter, WatchLogRow } from "../../media/types/watch-log.types";
import { TvInteractionsRepository } from "../repositories/tv-interactions.repository";
import { TvActivityService } from "./tv-activity.service";
import { TvCacheService } from "./tv-cache.service";
import { TvWatchStatusService } from "./tv-watch-status.service";

type Series = NonNullable<Awaited<ReturnType<typeof TvCacheService.findOrCreate>>>;
type SeriesLogEntry = Omit<WatchLogRow, "mediaId"> & { seriesId: number };

// The Series side of the Watch Log module: logging also completes the
// series and cascades to every season and episode.
export const seriesWatchLog: WatchLogAdapter<
  Series,
  SeriesLogEntry,
  { entry: SeriesLogEntry; series: Series; review: AttachedReview | null }
> = {
  mediaType: "tv",
  store: WatchLogStores.series,
  findOrCreateTitle: (tmdbId) => TvCacheService.findOrCreate(tmdbId),
  prepareMarkWatched: async (series) => {
    const seasonEpisodeNumbers = await TvActivityService.resolveSeasonEpisodeNumbers(series);
    return async (userId) => {
      await Promise.all([
        TvWatchStatusService.setStatus(userId, series.id, "completed"),
        TvActivityService.cascadeSeasonsWatched(userId, series, seasonEpisodeNumbers),
        // Clears the Watchlist, as watching a Film does.
        TvInteractionsRepository.upsertInteraction({ userId, seriesId: series.id, watched: true }),
      ]);
    };
  },
  unwatch: (userId, seriesId) => TvActivityService.unwatchSeries(userId, seriesId),
  activitySubject: (series) => ({ kind: "series", series }),
  toEntry: ({ mediaId, ...row }) => ({ ...row, seriesId: mediaId }),
  toCreated: ({ entry, title, review }) => ({ entry, series: title, review }),
};
