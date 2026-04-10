import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import {
  MAX_TOP_PICK_ITEMS_PER_CATEGORY,
} from "../constants/top-picks.constants";
import { profileTopPicks } from "../users.entity";
import type { UpdateTopPicksInput } from "../dto/users.dto";

export type NormalizedTopPickItem = {
  slot: number;
  mediaType: string;
  mediaSource: string;
  mediaSourceId: string;
  title: string | null;
  posterPath: string | null;
  releaseYear: number | null;
};

export type NormalizedTopPickCategoryWithItems = {
  categoryId: number;
  items: NormalizedTopPickItem[];
};

export class UsersTopPicksRepository {
  static normalizeTopPickCategories(
    categories: UpdateTopPicksInput,
  ): NormalizedTopPickCategoryWithItems[] {
    return categories.map((category) => {
      const items = [...category.items]
        .sort((left, right) => left.slot - right.slot)
        .slice(0, MAX_TOP_PICK_ITEMS_PER_CATEGORY)
        .map((item): NormalizedTopPickItem => ({
          slot: item.slot,
          mediaType: item.mediaType,
          mediaSource: item.mediaSource,
          mediaSourceId: item.mediaSourceId,
          title: item.title?.trim() || null,
          posterPath: item.posterPath ?? null,
          releaseYear: item.releaseYear ?? null,
        }));

      return {
        categoryId: category.categoryId,
        items,
      };
    });
  }

  static async replaceTopPicksForCategories(
    userId: string,
    categories: NormalizedTopPickCategoryWithItems[],
  ): Promise<void> {
    if (categories.length === 0) {
      return;
    }

    const categoryIds = [...new Set(categories.map((category) => category.categoryId))];

    if (categoryIds.length > 0) {
      await db
        .delete(profileTopPicks)
        .where(
          and(
            eq(profileTopPicks.userId, userId),
            inArray(profileTopPicks.categoryId, categoryIds),
          ),
        );
    }

    const rowsToInsert = categories.flatMap((category) =>
      category.items.map((item) => ({
        userId,
        categoryId: category.categoryId,
        slot: item.slot,
        mediaType: item.mediaType,
        mediaSource: item.mediaSource,
        mediaSourceId: item.mediaSourceId,
        title: item.title,
        posterPath: item.posterPath,
        releaseYear: item.releaseYear,
      })),
    );

    if (rowsToInsert.length > 0) {
      await db.insert(profileTopPicks).values(rowsToInsert);
    }
  }

  static async getTopPicksByUserId(userId: string) {
    return db
      .select({
        id: profileTopPicks.id,
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
  }
}
