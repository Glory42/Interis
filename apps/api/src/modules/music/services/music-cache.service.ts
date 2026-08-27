import {
  getReleaseGroupDetail,
  getCoverArtUrl,
  extractTopGenres,
  buildArtistName,
  parseFirstReleaseYear,
} from "../../../infrastructure/musicbrainz/albums";
import { getAlbumStats } from "../../../infrastructure/lastfm/albums";
import { MusicCacheRepository } from "../repositories/music-cache.repository";

// Last.fm has no per-album rate-limit concern like NYT's, but it's still an
// extra network call this shouldn't add to every request - refreshed lazily
// in the background (see docs/adr/0003), same "never block the base fetch
// on it" rule as the rest of this service.
const LASTFM_TTL_MS = 24 * 60 * 60 * 1000;

export class MusicCacheService {
  static async findOrCreate(mbid: string) {
    const existing = await MusicCacheRepository.findByMbid(mbid);
    if (existing) {
      this.maybeRefreshLastfmStats(existing);
      return existing;
    }

    const rg = await getReleaseGroupDetail(mbid);
    const coverArtUrl = await getCoverArtUrl(mbid).catch(() => null);

    const album = await MusicCacheRepository.upsert({
      mbid: rg.id,
      title: rg.title,
      artistName: buildArtistName(rg),
      artistMbid: rg["artist-credit"]?.[0]?.artist?.id ?? null,
      coverArtUrl,
      primaryType: rg["primary-type"] ?? null,
      secondaryTypes: rg["secondary-types"] ?? [],
      firstReleaseDate: rg["first-release-date"] ?? null,
      firstReleaseYear: parseFirstReleaseYear(rg),
      genres: extractTopGenres(rg),
      disambiguation: rg.disambiguation ?? null,
    });

    if (album) {
      this.maybeRefreshLastfmStats(album);
    }

    return album;
  }

  private static maybeRefreshLastfmStats(album: {
    id: number;
    title: string;
    artistName: string;
    lastfmFetchedAt: Date | null;
  }): void {
    const isStale =
      !album.lastfmFetchedAt || Date.now() - album.lastfmFetchedAt.getTime() > LASTFM_TTL_MS;
    if (!isStale) {
      return;
    }

    getAlbumStats(album.artistName, album.title)
      .then((stats) => {
        if (stats) {
          return MusicCacheRepository.updateLastfmStats(album.id, stats);
        }
      })
      .catch(() => undefined);
  }
}
