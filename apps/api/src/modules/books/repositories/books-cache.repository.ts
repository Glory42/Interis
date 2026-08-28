import { eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { books } from "../books.entity";

export class BooksCacheRepository {
  static async findByVolumeId(googleVolumeId: string) {
    const [row] = await db.select().from(books).where(eq(books.googleVolumeId, googleVolumeId)).limit(1);
    return row ?? null;
  }

  static async findByIsbn13(isbn13: string) {
    const [row] = await db.select().from(books).where(eq(books.isbn13, isbn13)).limit(1);
    return row ?? null;
  }

  static async upsert(input: {
    googleVolumeId: string;
    title: string;
    subtitle: string | null;
    authors: string[];
    publisher: string | null;
    publishedDate: string | null;
    publishedYear: number | null;
    pageCount: number | null;
    language: string | null;
    categories: string[];
    description: string | null;
    coverImageUrl: string | null;
    isbn13: string | null;
    googleBooksUrl: string | null;
  }) {
    const [inserted] = await db
      .insert(books)
      .values(input)
      .onConflictDoUpdate({
        target: books.googleVolumeId,
        set: {
          title: input.title,
          subtitle: input.subtitle,
          authors: input.authors,
          publisher: input.publisher,
          publishedDate: input.publishedDate,
          publishedYear: input.publishedYear,
          pageCount: input.pageCount,
          language: input.language,
          categories: input.categories,
          description: input.description,
          coverImageUrl: input.coverImageUrl,
          isbn13: input.isbn13,
          googleBooksUrl: input.googleBooksUrl,
          cachedAt: new Date(),
        },
      })
      .returning();
    return inserted ?? null;
  }
}
