import {
  getFilmWatchProviders,
  getSeriesWatchProviders,
} from "../../../infrastructure/tmdb/watch-providers";
import type { MediaType } from "../constants/media-type.constant";
import { sliceWatchProvidersRegion } from "../helpers/watch-providers.helper";
import type { WatchProvidersResult } from "../types/watch-providers.types";

const fetchers = {
  movie: getFilmWatchProviders,
  tv: getSeriesWatchProviders,
} satisfies Record<MediaType, (tmdbId: number) => Promise<unknown>>;

// Where to watch a Film or Series, straight from the cached TMDB response; no DB involved.
export class WatchProvidersService {
  static async getForRegion(
    mediaType: MediaType,
    tmdbId: number,
    region: string,
  ): Promise<WatchProvidersResult> {
    const response = await fetchers[mediaType](tmdbId);
    return sliceWatchProvidersRegion(response, region);
  }
}
