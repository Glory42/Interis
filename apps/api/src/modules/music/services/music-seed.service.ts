import {
  buildArtistName,
  parseFirstReleaseYear,
  extractTopGenres,
  searchAlbums,
} from "../../../infrastructure/musicbrainz/albums";
import { MusicCacheRepository } from "../repositories/music-cache.repository";
import { MusicArchiveRepository } from "../repositories/music-archive.repository";

const SEED_THRESHOLD = 10;

type StaticAlbum = {
  mbid: string;
  title: string;
  artistName: string;
  primaryType: string;
  firstReleaseDate: string;
  genres: { name: string; count: number }[];
};

const STATIC_SEED: StaticAlbum[] = [
  { mbid: "b84ee12a-09ef-421b-82de-0441a926375b", title: "Abbey Road", artistName: "The Beatles", primaryType: "Album", firstReleaseDate: "1969-09-26", genres: [{ name: "rock", count: 10 }, { name: "pop", count: 8 }] },
  { mbid: "f5093c06-23e3-404f-aeaa-37d6da7de5a4", title: "The Dark Side of the Moon", artistName: "Pink Floyd", primaryType: "Album", firstReleaseDate: "1973-03-01", genres: [{ name: "progressive rock", count: 10 }, { name: "rock", count: 8 }] },
  { mbid: "fdda9d45-4745-4c28-b8ba-3f82c8ca6659", title: "Thriller", artistName: "Michael Jackson", primaryType: "Album", firstReleaseDate: "1982-11-30", genres: [{ name: "pop", count: 10 }, { name: "r&b", count: 8 }] },
  { mbid: "47d8c9d0-b05a-44ee-9b07-d47e3c41278c", title: "OK Computer", artistName: "Radiohead", primaryType: "Album", firstReleaseDate: "1997-05-21", genres: [{ name: "alternative rock", count: 10 }, { name: "art rock", count: 7 }] },
  { mbid: "5c017ae2-ec31-4b7b-aace-32af02a8dd38", title: "Led Zeppelin IV", artistName: "Led Zeppelin", primaryType: "Album", firstReleaseDate: "1971-11-08", genres: [{ name: "hard rock", count: 10 }, { name: "blues rock", count: 7 }] },
  { mbid: "9ab0cb55-5429-4b33-9b51-a1eb6a4d7291", title: "Rumours", artistName: "Fleetwood Mac", primaryType: "Album", firstReleaseDate: "1977-02-04", genres: [{ name: "soft rock", count: 10 }, { name: "pop rock", count: 8 }] },
  { mbid: "1b022e01-4da6-387b-8658-8678046e4cef", title: "The College Dropout", artistName: "Kanye West", primaryType: "Album", firstReleaseDate: "2004-02-10", genres: [{ name: "hip hop", count: 10 }, { name: "rap", count: 9 }] },
  { mbid: "a7df3ddf-5072-484f-9d48-a15e0fa0b84f", title: "Random Access Memories", artistName: "Daft Punk", primaryType: "Album", firstReleaseDate: "2013-05-17", genres: [{ name: "electronic", count: 10 }, { name: "funk", count: 7 }] },
  { mbid: "6e5f5b2e-bfb2-408b-a55f-0e9d2ea7df84", title: "Back to Black", artistName: "Amy Winehouse", primaryType: "Album", firstReleaseDate: "2006-10-27", genres: [{ name: "soul", count: 10 }, { name: "r&b", count: 8 }] },
  { mbid: "d6da44b5-70cf-3787-8046-9be1978ef35f", title: "Kind of Blue", artistName: "Miles Davis", primaryType: "Album", firstReleaseDate: "1959-08-17", genres: [{ name: "jazz", count: 10 }, { name: "modal jazz", count: 8 }] },
  { mbid: "d5e4ff07-a7d9-479a-b1b9-9f58f6ad44be", title: "Blue", artistName: "Joni Mitchell", primaryType: "Album", firstReleaseDate: "1971-06-22", genres: [{ name: "folk", count: 10 }, { name: "singer-songwriter", count: 8 }] },
  { mbid: "2b8d9de0-ef21-3267-a494-6e574f948c20", title: "The Bends", artistName: "Radiohead", primaryType: "Album", firstReleaseDate: "1995-03-13", genres: [{ name: "alternative rock", count: 10 }, { name: "britpop", count: 5 }] },
];

export class MusicSeedService {
  static async seedIfEmpty(): Promise<void> {
    const count = await MusicArchiveRepository.getTotalCount();
    if (count >= SEED_THRESHOLD) return;

    // Try MusicBrainz search first; fall back to static seed if unavailable
    const fromMb = await MusicSeedService.seedFromMusicBrainz().catch(() => 0);
    if (fromMb === 0) {
      await MusicSeedService.seedFromStaticList();
    }
  }

  private static async seedFromMusicBrainz(): Promise<number> {
    const pages = await Promise.allSettled([
      searchAlbums("type:Album"),
      searchAlbums("type:Album tag:rock"),
    ]);

    const seen = new Set<string>();
    const toInsert = pages.flatMap((result) => {
      if (result.status === "rejected") return [];
      return result.value.filter((rg) => {
        if (seen.has(rg.id)) return false;
        seen.add(rg.id);
        return true;
      });
    });

    if (toInsert.length === 0) return 0;

    await Promise.allSettled(
      toInsert.map((rg) =>
        MusicCacheRepository.upsert({
          mbid: rg.id,
          title: rg.title,
          artistName: buildArtistName(rg),
          artistMbid: rg["artist-credit"]?.[0]?.artist?.id ?? null,
          coverArtUrl: null,
          primaryType: rg["primary-type"] ?? null,
          secondaryTypes: [],
          firstReleaseDate: rg["first-release-date"] ?? null,
          firstReleaseYear: parseFirstReleaseYear(rg),
          genres: extractTopGenres(rg),
          disambiguation: rg.disambiguation ?? null,
        }),
      ),
    );

    return toInsert.length;
  }

  private static async seedFromStaticList(): Promise<void> {
    await Promise.allSettled(
      STATIC_SEED.map((album) =>
        MusicCacheRepository.upsert({
          mbid: album.mbid,
          title: album.title,
          artistName: album.artistName,
          artistMbid: null,
          coverArtUrl: null,
          primaryType: album.primaryType,
          secondaryTypes: [],
          firstReleaseDate: album.firstReleaseDate,
          firstReleaseYear: Number.parseInt(album.firstReleaseDate.slice(0, 4), 10),
          genres: album.genres,
          disambiguation: null,
        }),
      ),
    );
  }
}
