import { eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { lastfmTrendingCache } from "../music.entity";

export type LastfmTrendingItem = { artistName: string; albumTitle: string; mbid: string };

export class LastfmTrendingCacheRepository {
  static async findByChartKey(chartKey: string) {
    const [row] = await db
      .select()
      .from(lastfmTrendingCache)
      .where(eq(lastfmTrendingCache.chartKey, chartKey))
      .limit(1);
    return row ?? null;
  }

  static async upsert(chartKey: string, items: LastfmTrendingItem[]) {
    const [row] = await db
      .insert(lastfmTrendingCache)
      .values({ chartKey, items })
      .onConflictDoUpdate({
        target: lastfmTrendingCache.chartKey,
        set: { items, fetchedAt: new Date() },
      })
      .returning();
    return row ?? null;
  }
}
