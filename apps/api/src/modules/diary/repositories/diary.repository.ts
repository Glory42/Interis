import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { filmInteractions } from "../../interactions/interactions.entity";
import { films } from "../../films/films.entity";
import { reviews } from "../../reviews/reviews.entity";
import { applyOptionalPagination } from "../../../commons/helpers/db-pagination.helper";
import { diaryEntries } from "../diary.entity";

export class DiaryRepository {
  static async findAllByUser(userId: string, limit?: number, offset?: number) {
    const query = db
      .select({
        id: diaryEntries.id,
        watchedDate: diaryEntries.watchedDate,
        rating: diaryEntries.rating,
        rewatch: diaryEntries.rewatch,
        movieId: diaryEntries.movieId,
        createdAt: diaryEntries.createdAt,
        updatedAt: diaryEntries.updatedAt,
        movieTmdbId: films.tmdbId,
        movieTitle: films.title,
        moviePosterPath: films.posterPath,
        movieReleaseYear: films.releaseYear,
        reviewId: reviews.id,
        reviewContent: reviews.content,
        reviewContainsSpoilers: reviews.containsSpoilers,
        reviewCreatedAt: reviews.createdAt,
        liked: sql<boolean>`coalesce(${filmInteractions.liked}, false)`,
      })
      .from(diaryEntries)
      .innerJoin(films, eq(films.id, diaryEntries.movieId))
      .leftJoin(
        reviews,
        // A log's review is the one written with it, not any review of the
        // same movie (#73).
        and(eq(reviews.diaryEntryId, diaryEntries.id), eq(reviews.mediaType, "movie")),
      )
      .leftJoin(
        filmInteractions,
        and(
          eq(filmInteractions.userId, diaryEntries.userId),
          eq(filmInteractions.movieId, diaryEntries.movieId),
        ),
      )
      .where(eq(diaryEntries.userId, userId))
      .orderBy(desc(diaryEntries.watchedDate), desc(diaryEntries.createdAt))
      .$dynamic();

    return applyOptionalPagination(query, limit, offset);
  }
}
