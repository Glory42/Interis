import { asc, eq, inArray } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { movies } from "../../movies/movies.entity";
import { tvSeries } from "../../serials/serials.entity";
import {
  TOP_PICK_CATEGORY_IDS,
  TOP_PICK_CATEGORY_KEYS,
  TOP_PICK_SUPPORTED_CATEGORY_ID_SET,
  type TopPickCategoryId,
  type TopPickCategoryKey,
} from "../../users/constants/top-picks.constants";
import { profileTopPicks } from "../../users/users.entity";

type PublicTopPickItem = {
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
    const topPickRows = await db
      .select({
        categoryId: profileTopPicks.categoryId,
        slot: profileTopPicks.slot,
        mediaType: profileTopPicks.mediaType,
        mediaSource: profileTopPicks.mediaSource,
        mediaSourceId: profileTopPicks.mediaSourceId,
        title: profileTopPicks.title,
        posterPath: profileTopPicks.posterPath,
        releaseYear: profileTopPicks.releaseYear,
      })
      .from(profileTopPicks)
      .where(eq(profileTopPicks.userId, userId))
      .orderBy(asc(profileTopPicks.categoryId), asc(profileTopPicks.slot));

    const cinemaTmdbIds = topPickRows
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
      cinemaTmdbIds.length > 0
        ? db
            .select({
              id: movies.id,
              tmdbId: movies.tmdbId,
              title: movies.title,
              posterPath: movies.posterPath,
              releaseYear: movies.releaseYear,
            })
            .from(movies)
            .where(inArray(movies.tmdbId, [...new Set(cinemaTmdbIds)]))
        : Promise.resolve([]),
      serialTmdbIds.length > 0
        ? db
            .select({
              id: tvSeries.id,
              tmdbId: tvSeries.tmdbId,
              title: tvSeries.title,
              posterPath: tvSeries.posterPath,
              releaseYear: tvSeries.firstAirYear,
            })
            .from(tvSeries)
            .where(inArray(tvSeries.tmdbId, [...new Set(serialTmdbIds)]))
        : Promise.resolve([]),
    ]);

    const movieByTmdbId = new Map(movieRows.map((row) => [row.tmdbId, row]));
    const serialByTmdbId = new Map(serialRows.map((row) => [row.tmdbId, row]));

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
        (id) => categoriesById.get(id) as PublicTopPickCategory,
      ),
    };
  }
}
