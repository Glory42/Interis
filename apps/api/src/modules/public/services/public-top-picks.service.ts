import {
  TOP_PICK_CATEGORY_IDS,
  TOP_PICK_CATEGORY_KEYS,
  TOP_PICK_SUPPORTED_CATEGORY_ID_SET,
  type TopPickCategoryId,
  type TopPickCategoryKey,
} from "../../users/constants/top-picks.constants";
import { PublicTopPicksRepository } from "../repositories/public-top-picks.repository";

type PublicTopPickItem = {
  slot: number;
  mediaType: string;
  mediaSource: string;
  mediaSourceId: string;
  entityId: number | null;
  tmdbId: number | null;
  title: string | null;
  posterPath: string | null;
  coverArtUrl: string | null;
  releaseYear: number | null;
  artistName: string | null;
  authors: string[] | null;
};

type PublicTopPickCategory = {
  id: TopPickCategoryId;
  key: TopPickCategoryKey;
  supported: boolean;
  items: PublicTopPickItem[];
};

type PublicTopPicksResponse = {
  categories: PublicTopPickCategory[];
};

export class PublicTopPicksService {
  static async getTop4ByUserId(userId: string): Promise<PublicTopPicksResponse> {
    const topPickRows = await PublicTopPicksRepository.getTopPicksByUserId(userId);

    const cinemaTmdbIds = topPickRows
      .filter((row) => row.categoryId === 1 && row.mediaSource === "tmdb" && Number.isInteger(Number(row.mediaSourceId)))
      .map((row) => Number(row.mediaSourceId));

    const serialTmdbIds = topPickRows
      .filter((row) => row.categoryId === 2 && row.mediaSource === "tmdb" && Number.isInteger(Number(row.mediaSourceId)))
      .map((row) => Number(row.mediaSourceId));

    const musicMbids = topPickRows
      .filter((row) => row.categoryId === 3 && row.mediaSource === "musicbrainz")
      .map((row) => row.mediaSourceId);

    const bookVolumeIds = topPickRows
      .filter((row) => row.categoryId === 4 && row.mediaSource === "googlebooks")
      .map((row) => row.mediaSourceId);

    const [movieRows, serialRows, albumRows, bookRows] = await Promise.all([
      PublicTopPicksRepository.getMoviesByTmdbIds([...new Set(cinemaTmdbIds)]),
      PublicTopPicksRepository.getSeriesByTmdbIds([...new Set(serialTmdbIds)]),
      PublicTopPicksRepository.getAlbumsByMbids([...new Set(musicMbids)]),
      PublicTopPicksRepository.getBooksByVolumeIds([...new Set(bookVolumeIds)]),
    ]);

    const movieByTmdbId = new Map(movieRows.map((row) => [row.tmdbId, row]));
    const serialByTmdbId = new Map(serialRows.map((row) => [row.tmdbId, row]));
    const albumByMbid = new Map(albumRows.map((row) => [row.mbid, row]));
    const bookByVolumeId = new Map(bookRows.map((row) => [row.googleVolumeId, row]));

    const categoriesById = new Map<TopPickCategoryId, PublicTopPickCategory>(
      TOP_PICK_CATEGORY_IDS.map((id) => [
        id,
        {
          id,
          key: TOP_PICK_CATEGORY_KEYS[id],
          supported: TOP_PICK_SUPPORTED_CATEGORY_ID_SET.has(id),
          items: [],
        },
      ]),
    );

    for (const row of topPickRows) {
      if (!(row.categoryId in TOP_PICK_CATEGORY_KEYS)) continue;

      const category = categoriesById.get(row.categoryId as TopPickCategoryId);
      if (!category) continue;

      const parsedSourceId = Number(row.mediaSourceId);
      const isTmdbSourceId = Number.isInteger(parsedSourceId);

      const movie = row.categoryId === 1 && row.mediaSource === "tmdb" && isTmdbSourceId
        ? movieByTmdbId.get(parsedSourceId) ?? null
        : null;

      const series = row.categoryId === 2 && row.mediaSource === "tmdb" && isTmdbSourceId
        ? serialByTmdbId.get(parsedSourceId) ?? null
        : null;

      const album = row.categoryId === 3 && row.mediaSource === "musicbrainz"
        ? albumByMbid.get(row.mediaSourceId) ?? null
        : null;

      const book = row.categoryId === 4 && row.mediaSource === "googlebooks"
        ? bookByVolumeId.get(row.mediaSourceId) ?? null
        : null;

      category.items.push({
        slot: row.slot,
        mediaType: row.mediaType,
        mediaSource: row.mediaSource,
        mediaSourceId: row.mediaSourceId,
        entityId: movie?.id ?? series?.id ?? album?.id ?? book?.id ?? null,
        tmdbId: row.mediaSource === "tmdb" && isTmdbSourceId ? parsedSourceId : null,
        title: movie?.title ?? series?.title ?? album?.title ?? book?.title ?? row.title ?? null,
        posterPath: movie?.posterPath ?? series?.posterPath ?? row.posterPath ?? null,
        coverArtUrl: album?.coverArtUrl ?? book?.coverImageUrl ?? null,
        releaseYear: movie?.releaseYear ?? series?.releaseYear ?? album?.firstReleaseYear ?? book?.publishedYear ?? row.releaseYear ?? null,
        artistName: album?.artistName ?? null,
        authors: (book?.authors as string[] | null) ?? null,
      });
    }

    for (const category of categoriesById.values()) {
      category.items.sort((left, right) => left.slot - right.slot);
    }

    return {
      categories: TOP_PICK_CATEGORY_IDS.map(
        (id) => categoriesById.get(id) as PublicTopPickCategory,
      ),
    };
  }
}
