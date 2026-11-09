import {
  TOP_PICK_CATEGORY_IDS,
  TOP_PICK_CATEGORY_KEYS,
  TOP_PICK_SUPPORTED_CATEGORY_ID_SET,
  type TopPickCategoryId,
  type TopPickCategoryKey,
} from "../constants/top-picks.constants";
import { UsersTopPicksRepository } from "../repositories/users-top-picks.repository";

type Top4Item = {
  slot: number;
  mediaType: string;
  mediaSource: string;
  mediaSourceId: string;
  entityId: number | null;
  tmdbId: number | null;
  title: string | null;
  posterPath: string | null;
  releaseYear: number | null;
};

type Top4Category = {
  id: TopPickCategoryId;
  key: TopPickCategoryKey;
  supported: boolean;
  items: Top4Item[];
};

type ProfileTop4 = {
  categories: Top4Category[];
};

export class ProfileTop4Service {
  static async getTop4(userId: string): Promise<ProfileTop4> {
    const topPickRows = await UsersTopPicksRepository.getTopPicksByUserId(userId);

    const movieTmdbIds = topPickRows
      .filter(
        (row) =>
          row.categoryId === 1 &&
          row.mediaType === "movie" &&
          row.mediaSource === "tmdb" &&
          Number.isInteger(Number(row.mediaSourceId)),
      )
      .map((row) => Number(row.mediaSourceId));

    const serialTmdbIds = topPickRows
      .filter(
        (row) =>
          row.categoryId === 2 &&
          row.mediaType === "tv" &&
          row.mediaSource === "tmdb" &&
          Number.isInteger(Number(row.mediaSourceId)),
      )
      .map((row) => Number(row.mediaSourceId));

    const [movieRows, serialRows] = await Promise.all([
      UsersTopPicksRepository.getMoviesByTmdbIds([...new Set(movieTmdbIds)]),
      UsersTopPicksRepository.getSeriesByTmdbIds([...new Set(serialTmdbIds)]),
    ]);

    const movieByTmdbId = new Map(movieRows.map((row) => [row.tmdbId, row]));
    const serialByTmdbId = new Map(serialRows.map((row) => [row.tmdbId, row]));

    const categoriesById = new Map<TopPickCategoryId, Top4Category>(
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
      if (!(row.categoryId in TOP_PICK_CATEGORY_KEYS)) {
        continue;
      }

      const category = categoriesById.get(row.categoryId as TopPickCategoryId);
      if (!category) {
        continue;
      }

      const parsedSourceId = Number(row.mediaSourceId);
      const isTmdbSourceId = Number.isInteger(parsedSourceId);

      const movie =
        row.categoryId === 1 && row.mediaSource === "tmdb" && isTmdbSourceId
          ? movieByTmdbId.get(parsedSourceId)
          : null;

      const series =
        row.categoryId === 2 && row.mediaSource === "tmdb" && isTmdbSourceId
          ? serialByTmdbId.get(parsedSourceId)
          : null;

      category.items.push({
        slot: row.slot,
        mediaType: row.mediaType,
        mediaSource: row.mediaSource,
        mediaSourceId: row.mediaSourceId,
        entityId: movie?.id ?? series?.id ?? null,
        tmdbId:
          row.mediaSource === "tmdb" && isTmdbSourceId ? parsedSourceId : null,
        title: movie?.title ?? series?.title ?? row.title ?? null,
        posterPath: movie?.posterPath ?? series?.posterPath ?? row.posterPath ?? null,
        releaseYear: movie?.releaseYear ?? series?.releaseYear ?? row.releaseYear ?? null,
      });
    }

    for (const category of categoriesById.values()) {
      category.items.sort((left, right) => left.slot - right.slot);
    }

    return {
      categories: TOP_PICK_CATEGORY_IDS.map(
        (id) => categoriesById.get(id) as Top4Category,
      ),
    };
  }
}
