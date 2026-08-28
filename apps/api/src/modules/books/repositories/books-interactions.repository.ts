import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { profiles } from "../../users/users.entity";
import { reviews } from "../../reviews/reviews.entity";
import { books, bookDiaryEntries, bookInteractions } from "../books.entity";

export class BooksInteractionsRepository {
  static async getInteraction(userId: string, bookId: number) {
    const [row] = await db
      .select()
      .from(bookInteractions)
      .where(and(eq(bookInteractions.userId, userId), eq(bookInteractions.bookId, bookId)))
      .limit(1);
    return row ?? null;
  }

  static async upsertInteraction(
    userId: string,
    bookId: number,
    input: { liked?: boolean; wantToRead?: boolean; rating?: number | null },
  ) {
    const [row] = await db
      .insert(bookInteractions)
      .values({
        userId,
        bookId,
        liked: input.liked ?? false,
        wantToRead: input.wantToRead ?? false,
        rating: input.rating ?? null,
      })
      .onConflictDoUpdate({
        target: [bookInteractions.userId, bookInteractions.bookId],
        set: {
          ...(input.liked !== undefined && { liked: input.liked }),
          ...(input.wantToRead !== undefined && { wantToRead: input.wantToRead }),
          ...(input.rating !== undefined && { rating: input.rating }),
          updatedAt: new Date(),
        },
      })
      .returning();
    return row ?? null;
  }

  static async createLog(userId: string, bookId: number, input: {
    readDate: string;
    rating: number | null;
    reread: boolean;
  }) {
    const [row] = await db
      .insert(bookDiaryEntries)
      .values({ userId, bookId, ...input })
      .returning();
    return row ?? null;
  }

  static async updateLog(id: string, userId: string, input: {
    readDate?: string;
    rating?: number | null;
    reread?: boolean;
  }) {
    const [row] = await db
      .update(bookDiaryEntries)
      .set({
        ...(input.readDate !== undefined && { readDate: input.readDate }),
        ...(input.rating !== undefined && { rating: input.rating }),
        ...(input.reread !== undefined && { reread: input.reread }),
      })
      .where(and(eq(bookDiaryEntries.id, id), eq(bookDiaryEntries.userId, userId)))
      .returning();
    return row ?? null;
  }

  static async deleteLog(id: string, userId: string) {
    const [row] = await db
      .delete(bookDiaryEntries)
      .where(and(eq(bookDiaryEntries.id, id), eq(bookDiaryEntries.userId, userId)))
      .returning({ id: bookDiaryEntries.id });
    return row ?? null;
  }

  static async getMyLogs(userId: string) {
    return db
      .select({
        id: bookDiaryEntries.id,
        readDate: bookDiaryEntries.readDate,
        rating: bookDiaryEntries.rating,
        reread: bookDiaryEntries.reread,
        bookId: bookDiaryEntries.bookId,
        createdAt: bookDiaryEntries.createdAt,
        updatedAt: bookDiaryEntries.updatedAt,
        bookGoogleVolumeId: books.googleVolumeId,
        bookTitle: books.title,
        bookAuthors: books.authors,
        bookCoverImageUrl: books.coverImageUrl,
        bookPublishedYear: books.publishedYear,
        reviewId: reviews.id,
        reviewContent: reviews.content,
      })
      .from(bookDiaryEntries)
      .innerJoin(books, eq(books.id, bookDiaryEntries.bookId))
      .leftJoin(
        reviews,
        and(
          eq(reviews.userId, bookDiaryEntries.userId),
          eq(reviews.mediaType, "book"),
          eq(reviews.mediaSourceId, books.googleVolumeId),
        ),
      )
      .where(eq(bookDiaryEntries.userId, userId))
      .orderBy(desc(bookDiaryEntries.readDate), desc(bookDiaryEntries.createdAt));
  }

  static async getLogsByBookId(bookId: number) {
    return db
      .select({
        diaryEntryId: bookDiaryEntries.id,
        readDate: bookDiaryEntries.readDate,
        rating: bookDiaryEntries.rating,
        reread: bookDiaryEntries.reread,
        createdAt: bookDiaryEntries.createdAt,
        username: user.username,
        userDisplayName: user.name,
        avatarUrl: profiles.avatarUrl,
        reviewContent: reviews.content,
        reviewContainsSpoilers: reviews.containsSpoilers,
        reviewUpdatedAt: reviews.updatedAt,
      })
      .from(bookDiaryEntries)
      .innerJoin(user, eq(user.id, bookDiaryEntries.userId))
      .innerJoin(profiles, eq(profiles.userId, bookDiaryEntries.userId))
      .leftJoin(
        reviews,
        and(
          eq(reviews.userId, bookDiaryEntries.userId),
          eq(reviews.mediaType, "book"),
          eq(reviews.mediaSourceId, books.googleVolumeId),
        ),
      )
      .innerJoin(books, eq(books.id, bookDiaryEntries.bookId))
      .where(eq(bookDiaryEntries.bookId, bookId))
      .orderBy(desc(bookDiaryEntries.createdAt));
  }

  static async getLogCount(bookId: number): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookDiaryEntries)
      .where(eq(bookDiaryEntries.bookId, bookId));
    return row?.count ?? 0;
  }

  static async getViewerLog(userId: string, bookId: number) {
    const [row] = await db
      .select({
        id: bookDiaryEntries.id,
        readDate: bookDiaryEntries.readDate,
        reread: bookDiaryEntries.reread,
        rating: bookDiaryEntries.rating,
      })
      .from(bookDiaryEntries)
      .where(and(eq(bookDiaryEntries.userId, userId), eq(bookDiaryEntries.bookId, bookId)))
      .orderBy(desc(bookDiaryEntries.readDate))
      .limit(1);
    return row ?? null;
  }
}
