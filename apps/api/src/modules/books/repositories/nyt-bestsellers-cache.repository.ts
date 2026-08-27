import { eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { nytBestsellerCache } from "../books.entity";
import type { NytBestsellerItem } from "../../../infrastructure/nyt/books";

export class NytBestsellersCacheRepository {
  static async findByListName(listName: string) {
    const [row] = await db
      .select()
      .from(nytBestsellerCache)
      .where(eq(nytBestsellerCache.listName, listName))
      .limit(1);
    return row ?? null;
  }

  static async upsert(listName: string, items: NytBestsellerItem[]) {
    const [row] = await db
      .insert(nytBestsellerCache)
      .values({ listName, items })
      .onConflictDoUpdate({
        target: nytBestsellerCache.listName,
        set: { items, fetchedAt: new Date() },
      })
      .returning();
    return row ?? null;
  }
}
