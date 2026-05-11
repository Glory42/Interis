import { SQL, asc, desc, eq, ilike, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { books, bookDiaryEntries, bookInteractions } from "../books.entity";
import type { BooksArchiveSort } from "../dto/books.dto";

export class BooksArchiveRepository {
  static async getArchiveRows(input: {
    genre: string | null;
    language: string | null;
    sort: BooksArchiveSort;
    page: number;
    limit: number;
  }) {
    const orderBy = {
      logs_desc: desc(sql<number>`count(${bookDiaryEntries.id})`),
      published_desc: desc(books.publishedYear),
      published_asc: asc(books.publishedYear),
      rating_desc: desc(sql<number>`avg(${bookDiaryEntries.rating})`),
      title_asc: asc(books.title),
    }[input.sort] ?? desc(sql<number>`count(${bookDiaryEntries.id})`);

    const conditions: SQL[] = [];

    if (input.genre) {
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(${books.categories}) c
          WHERE lower(c) = lower(${input.genre})
        )`,
      );
    }

    if (input.language) {
      conditions.push(ilike(books.language, input.language));
    }

    const whereClause =
      conditions.length > 0
        ? conditions.reduce((acc, cond) => sql`${acc} AND ${cond}`)
        : undefined;

    const offset = (input.page - 1) * input.limit;

    const baseQuery = db
      .select({
        googleVolumeId: books.googleVolumeId,
        title: books.title,
        authors: books.authors,
        coverImageUrl: books.coverImageUrl,
        publishedYear: books.publishedYear,
        language: books.language,
        categories: books.categories,
        logCount: sql<number>`count(${bookDiaryEntries.id})::int`.as("logCount"),
        avgRatingOutOfTen: sql<number | null>`avg(${bookDiaryEntries.rating})::double precision`.as("avgRatingOutOfTen"),
      })
      .from(books)
      .leftJoin(bookDiaryEntries, eq(bookDiaryEntries.bookId, books.id));

    const rows = await (whereClause ? baseQuery.where(whereClause) : baseQuery)
      .groupBy(books.id)
      .orderBy(orderBy)
      .limit(input.limit)
      .offset(offset);

    return rows;
  }

  static async getTotalCount(): Promise<number> {
    const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(books);
    return row?.count ?? 0;
  }

  static async getTopGenres(limit = 50): Promise<{ name: string; count: number }[]> {
    const rows = await db.select({ categories: books.categories }).from(books);
    const genreMap = new Map<string, number>();
    for (const row of rows) {
      for (const g of row.categories ?? []) {
        genreMap.set(g, (genreMap.get(g) ?? 0) + 1);
      }
    }
    return [...genreMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  static async getViewerLoggedVolumeIds(userId: string) {
    const rows = await db
      .select({ googleVolumeId: books.googleVolumeId })
      .from(bookDiaryEntries)
      .innerJoin(books, eq(books.id, bookDiaryEntries.bookId))
      .where(eq(bookDiaryEntries.userId, userId))
      .groupBy(books.googleVolumeId);
    return rows.map((r) => r.googleVolumeId);
  }

  static async getViewerWantToReadVolumeIds(userId: string) {
    const rows = await db
      .select({ googleVolumeId: books.googleVolumeId })
      .from(bookInteractions)
      .innerJoin(books, eq(books.id, bookInteractions.bookId))
      .where(sql`${bookInteractions.userId} = ${userId} AND ${bookInteractions.wantToRead} = true`)
      .groupBy(books.googleVolumeId);
    return rows.map((r) => r.googleVolumeId);
  }
}
