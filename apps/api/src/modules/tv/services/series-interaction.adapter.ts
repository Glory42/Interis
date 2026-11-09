import { isSeriesWatched } from "../../media-interactions/helpers/interaction-state-rules.helper";
import type { SeriesInteractionStateRow } from "../../media-interactions/media-interactions.repository";
import type { MediaInteractionAdapter } from "../../media-interactions/types/media-interaction.types";
import type { UpdateSeriesInteractionDto } from "../dto/tv.dto";
import { TvActivityService } from "./tv-activity.service";
import { TvCacheService } from "./tv-cache.service";
import { TvWatchStatusService } from "./tv-watch-status.service";

type Series = NonNullable<Awaited<ReturnType<typeof TvCacheService.findOrCreate>>>;

const toState = (row: SeriesInteractionStateRow | null) => ({
  liked: row?.liked ?? false,
  watchlisted: row?.watchlisted ?? false,
  rating: row?.rating ?? null,
  watched: isSeriesWatched(row?.watchStatus),
  watchStatus: row?.watchStatus ?? null,
});

// The Series side of the Interaction module: watched lives in the watch
// status, and a watched toggle cascades to every season and episode.
export const seriesInteraction: MediaInteractionAdapter<
  "tv",
  Series,
  UpdateSeriesInteractionDto,
  ReturnType<typeof toState>
> = {
  mediaType: "tv",
  findOrCreateMedia: (tmdbId) => TvCacheService.findOrCreate(tmdbId),
  activitySubject: (series) => ({ kind: "series", series }),
  // Only an explicit watched toggle cascades, even to the same value. Liking
  // or rating a series says nothing about which episodes were seen (#66).
  cascade: async (userId, series, change) => {
    if (change.watched !== undefined) {
      await TvActivityService.cascadeSeasonsWatched(
        userId,
        series,
        change.watched ? await TvActivityService.resolveSeasonEpisodeNumbers(series) : null,
      );
      await TvWatchStatusService.setStatus(userId, series.id, change.watched ? "completed" : null);
    } else if (change.watchStatus !== undefined) {
      await TvWatchStatusService.setUserStatus(userId, series, change.watchStatus);
    }
  },
  toState,
};
