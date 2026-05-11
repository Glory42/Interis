import {
  getReleaseGroupDetail,
  getCoverArtUrl,
  extractTopGenres,
  buildArtistName,
  parseFirstReleaseYear,
} from "../../../infrastructure/musicbrainz/albums";
import { MusicCacheRepository } from "../repositories/music-cache.repository";

export class MusicCacheService {
  static async findOrCreate(mbid: string) {
    const existing = await MusicCacheRepository.findByMbid(mbid);
    if (existing) {
      return existing;
    }

    const rg = await getReleaseGroupDetail(mbid);
    const coverArtUrl = await getCoverArtUrl(mbid).catch(() => null);

    return MusicCacheRepository.upsert({
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
  }
}
