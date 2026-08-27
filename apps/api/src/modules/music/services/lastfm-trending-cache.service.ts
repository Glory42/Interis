import { getTopArtists, getTopAlbumForArtist } from "../../../infrastructure/lastfm/charts";
import { searchAlbums } from "../../../infrastructure/musicbrainz/albums";
import {
  LastfmTrendingCacheRepository,
  type LastfmTrendingItem,
} from "../repositories/lastfm-trending-cache.repository";
import { LASTFM_TRENDING_ARTIST_LIMIT } from "../constants/music.constants";

// Last.fm has no top-albums chart of its own, so this composes one: each of
// the current top artists' most-played album, resolved to a MusicBrainz
// release-group mbid up front (by name - see getAlbumStats' comment on why
// Last.fm mbids aren't trustworthy here) so every other read of the cached
// list is a plain mbid lookup, never a repeat search. Same TTL-cached,
// lazy-background-refresh shape as NytBestsellersCacheService (see
// docs/adr/0003) - this fan-out of API calls only happens on that rare
// refresh path, never per-request.
const TTL_MS = 24 * 60 * 60 * 1000;

const resolveTrendingAlbums = async (): Promise<LastfmTrendingItem[]> => {
  const artistNames = await getTopArtists(LASTFM_TRENDING_ARTIST_LIMIT);

  const resolved = await Promise.all(
    artistNames.map(async (artistName): Promise<LastfmTrendingItem | null> => {
      const albumTitle = await getTopAlbumForArtist(artistName);
      if (!albumTitle) return null;

      const matches = await searchAlbums(`${artistName} ${albumTitle}`).catch(() => []);
      const mbid = matches[0]?.id;
      if (!mbid) return null;

      return { artistName, albumTitle, mbid };
    }),
  );

  return resolved.filter((item): item is LastfmTrendingItem => item !== null);
};

export class LastfmTrendingCacheService {
  static async getTrendingList(chartKey: string): Promise<LastfmTrendingItem[]> {
    const cached = await LastfmTrendingCacheRepository.findByChartKey(chartKey);

    if (!cached) {
      // True cold start - nothing to serve yet, so this one lookup blocks.
      const items = await resolveTrendingAlbums().catch(() => []);
      if (items.length === 0) {
        return items;
      }
      const row = await LastfmTrendingCacheRepository.upsert(chartKey, items);
      return row?.items ?? items;
    }

    const isStale = Date.now() - cached.fetchedAt.getTime() > TTL_MS;
    if (isStale) {
      // Serve the stale-but-present cache immediately; refresh in the
      // background so nobody's request waits on Last.fm/MusicBrainz.
      resolveTrendingAlbums()
        .then((items) =>
          items.length > 0 ? LastfmTrendingCacheRepository.upsert(chartKey, items) : undefined,
        )
        .catch(() => undefined);
    }

    return cached.items;
  }
}
