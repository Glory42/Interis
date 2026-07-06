import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { diaryEntries } from "../../diary/diary.entity";
import { comments, reviewLikes, reviews } from "../../reviews/reviews.entity";
import { serialDiaryEntries, serialSeasonInteractions, serialEpisodeInteractions, tvSeries } from "../../serials/serials.entity";
import { movies } from "../../movies/movies.entity";
import { profiles } from "../users.entity";

export class UsersReviewsRepository {
  static async getReviewsWithMovies(userId: string, limit?: number) {
    const movieQ = db
      .select({
        id: reviews.id,
        content: reviews.content,
        containsSpoilers: reviews.containsSpoilers,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        tmdbId: movies.tmdbId,
        title: movies.title,
        posterPath: movies.posterPath,
        releaseYear: movies.releaseYear,
        rating: diaryEntries.rating,
        mediaType: sql<"movie">`'movie'`,
      })
      .from(reviews)
      .innerJoin(movies, eq(reviews.movieId, movies.id))
      .leftJoin(diaryEntries, eq(reviews.diaryEntryId, diaryEntries.id))
      .where(and(eq(reviews.userId, userId), eq(reviews.mediaType, "movie")));

    const tvQ = db
      .select({
        id: reviews.id,
        content: reviews.content,
        containsSpoilers: reviews.containsSpoilers,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        tmdbId: reviews.mediaSourceId,
        rating: serialDiaryEntries.rating,
        mediaType: sql<"tv">`'tv'`,
      })
      .from(reviews)
      .leftJoin(serialDiaryEntries, eq(reviews.diaryEntryId, serialDiaryEntries.id))
      .where(and(eq(reviews.userId, userId), eq(reviews.mediaType, "tv")));

    const [movieReviewRows, tvReviewRows] = await Promise.all([
      limit ? movieQ.limit(limit) : movieQ,
      limit ? tvQ.limit(limit) : tvQ,
    ]);

    const normalizedMovieReviewRows = movieReviewRows.map((reviewRow) => ({
      id: reviewRow.id,
      content: reviewRow.content,
      containsSpoilers: reviewRow.containsSpoilers,
      createdAt: reviewRow.createdAt,
      updatedAt: reviewRow.updatedAt,
      tmdbId: reviewRow.tmdbId,
      title: reviewRow.title,
      posterPath: reviewRow.posterPath,
      releaseYear: reviewRow.releaseYear,
      rating: reviewRow.rating,
      mediaType: "movie" as const,
    }));

    const tvTmdbIds = tvReviewRows
      .map((reviewRow) => Number(reviewRow.tmdbId))
      .filter((tmdbId) => Number.isInteger(tmdbId) && tmdbId > 0);

    const tvRows = tvTmdbIds.length
      ? await db.select().from(tvSeries).where(inArray(tvSeries.tmdbId, tvTmdbIds))
      : [];

    const tvSeriesByTmdbId = new Map(tvRows.map((row) => [row.tmdbId, row]));

    const serialReviewRows = tvReviewRows
      .map((reviewRow) => {
        const tmdbId = Number(reviewRow.tmdbId);
        if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
          return null;
        }

        const series = tvSeriesByTmdbId.get(tmdbId);

        return {
          id: reviewRow.id,
          content: reviewRow.content,
          containsSpoilers: reviewRow.containsSpoilers,
          createdAt: reviewRow.createdAt,
          updatedAt: reviewRow.updatedAt,
          tmdbId,
          title: series?.title ?? "Unknown series",
          posterPath: series?.posterPath ?? null,
          releaseYear: series?.firstAirYear ?? null,
          rating: reviewRow.rating,
          mediaType: "tv" as const,
        };
      })
      .filter((reviewRow): reviewRow is NonNullable<typeof reviewRow> => reviewRow !== null);

    return [...normalizedMovieReviewRows, ...serialReviewRows].sort(
      (leftReview, rightReview) =>
        rightReview.createdAt.getTime() - leftReview.createdAt.getTime()
    );
  }

  static async getReviewDetailByUsername(
    username: string,
    reviewId: string,
    viewerUserId?: string | null,
  ) {
    const [reviewRow] = await db
      .select({
        id: reviews.id,
        content: reviews.content,
        containsSpoilers: reviews.containsSpoilers,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        diaryEntryId: reviews.diaryEntryId,
        mediaType: reviews.mediaType,
        mediaSourceId: reviews.mediaSourceId,
        movieId: reviews.movieId,
        authorId: user.id,
        authorUsername: user.username,
        authorDisplayUsername: user.displayUsername,
        authorImage: user.image,
        authorAvatarUrl: profiles.avatarUrl,
      })
      .from(reviews)
      .innerJoin(user, eq(reviews.userId, user.id))
      .leftJoin(profiles, eq(profiles.userId, user.id))
      .where(and(eq(user.username, username), eq(reviews.id, reviewId)))
      .limit(1);

    if (!reviewRow) {
      return null;
    }

    const [likeRow, commentRow, viewerLikeRow] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int`.as("count") })
        .from(reviewLikes)
        .where(eq(reviewLikes.reviewId, reviewId))
        .limit(1),
      db
        .select({ count: sql<number>`count(*)::int`.as("count") })
        .from(comments)
        .where(eq(comments.reviewId, reviewId))
        .limit(1),
      viewerUserId
        ? db
            .select({ reviewId: reviewLikes.reviewId })
            .from(reviewLikes)
            .where(
              and(
                eq(reviewLikes.userId, viewerUserId),
                eq(reviewLikes.reviewId, reviewId),
              ),
            )
            .limit(1)
        : Promise.resolve([]),
    ]);

    if (reviewRow.mediaType === "movie") {
      const [movieRow, diaryRow] = await Promise.all([
        reviewRow.movieId !== null
          ? db
              .select({
                tmdbId: movies.tmdbId,
                title: movies.title,
                posterPath: movies.posterPath,
                releaseYear: movies.releaseYear,
                genres: movies.genres,
                director: movies.director,
              })
              .from(movies)
              .where(eq(movies.id, reviewRow.movieId))
              .limit(1)
          : Promise.resolve([]),
        reviewRow.diaryEntryId
          ? db
              .select({ rating: diaryEntries.rating })
              .from(diaryEntries)
              .where(eq(diaryEntries.id, reviewRow.diaryEntryId))
              .limit(1)
          : Promise.resolve([]),
      ]);

      const tmdbId = movieRow[0]?.tmdbId ?? Number(reviewRow.mediaSourceId);

      if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
        return null;
      }

      const rating = diaryRow[0]?.rating ?? null;

      return {
        id: reviewRow.id,
        mediaType: "movie" as const,
        content: reviewRow.content,
        containsSpoilers: reviewRow.containsSpoilers,
        createdAt: reviewRow.createdAt,
        updatedAt: reviewRow.updatedAt,
        rating,
        author: {
          id: reviewRow.authorId,
          username: reviewRow.authorUsername,
          displayUsername: reviewRow.authorDisplayUsername,
          image: reviewRow.authorImage,
          avatarUrl: reviewRow.authorAvatarUrl,
        },
        media: {
          tmdbId,
          title: movieRow[0]?.title ?? "Unknown movie",
          posterPath: movieRow[0]?.posterPath ?? null,
          releaseYear: movieRow[0]?.releaseYear ?? null,
          genres: movieRow[0]?.genres ?? [],
          director: movieRow[0]?.director ?? null,
          creator: null,
        },
        engagement: {
          likeCount: likeRow[0]?.count ?? 0,
          commentCount: commentRow[0]?.count ?? 0,
          viewerHasLiked: viewerUserId ? viewerLikeRow.length > 0 : null,
        },
      };
    }

    if (reviewRow.mediaType === "tv") {
      const tmdbId = Number(reviewRow.mediaSourceId);

      if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
        return null;
      }

      const [seriesRow, serialDiaryRow] = await Promise.all([
        db
          .select({
            tmdbId: tvSeries.tmdbId,
            title: tvSeries.title,
            posterPath: tvSeries.posterPath,
            releaseYear: tvSeries.firstAirYear,
            genres: tvSeries.genres,
            creator: tvSeries.creator,
          })
          .from(tvSeries)
          .where(eq(tvSeries.tmdbId, tmdbId))
          .limit(1),
        reviewRow.diaryEntryId
          ? db
              .select({ rating: serialDiaryEntries.rating })
              .from(serialDiaryEntries)
              .where(eq(serialDiaryEntries.id, reviewRow.diaryEntryId))
              .limit(1)
          : Promise.resolve([]),
      ]);

      const rating = serialDiaryRow[0]?.rating ?? null;

      return {
        id: reviewRow.id,
        mediaType: "tv" as const,
        content: reviewRow.content,
        containsSpoilers: reviewRow.containsSpoilers,
        createdAt: reviewRow.createdAt,
        updatedAt: reviewRow.updatedAt,
        rating,
        author: {
          id: reviewRow.authorId,
          username: reviewRow.authorUsername,
          displayUsername: reviewRow.authorDisplayUsername,
          image: reviewRow.authorImage,
          avatarUrl: reviewRow.authorAvatarUrl,
        },
        media: {
          tmdbId,
          title: seriesRow[0]?.title ?? "Unknown series",
          posterPath: seriesRow[0]?.posterPath ?? null,
          releaseYear: seriesRow[0]?.releaseYear ?? null,
          genres: seriesRow[0]?.genres ?? [],
          director: null,
          creator: seriesRow[0]?.creator ?? null,
        },
        engagement: {
          likeCount: likeRow[0]?.count ?? 0,
          commentCount: commentRow[0]?.count ?? 0,
          viewerHasLiked: viewerUserId ? viewerLikeRow.length > 0 : null,
        },
      };
    }

    if (reviewRow.mediaType === "tv_season" || reviewRow.mediaType === "tv_episode") {
      const parts = reviewRow.mediaSourceId.split(":");
      const seriesTmdbId = Number(parts[0]);
      const seasonNumber = Number(parts[1]);
      const episodeNumber = reviewRow.mediaType === "tv_episode" ? Number(parts[2]) : null;

      if (!Number.isInteger(seriesTmdbId) || seriesTmdbId <= 0) {
        return null;
      }

      const [seriesRow, interactionRow] = await Promise.all([
        db
          .select({
            id: tvSeries.id,
            tmdbId: tvSeries.tmdbId,
            title: tvSeries.title,
            posterPath: tvSeries.posterPath,
            releaseYear: tvSeries.firstAirYear,
            genres: tvSeries.genres,
            creator: tvSeries.creator,
          })
          .from(tvSeries)
          .where(eq(tvSeries.tmdbId, seriesTmdbId))
          .limit(1),
        episodeNumber !== null
          ? db
              .select({ rating: serialEpisodeInteractions.rating })
              .from(serialEpisodeInteractions)
              .innerJoin(tvSeries, eq(serialEpisodeInteractions.seriesId, tvSeries.id))
              .where(
                and(
                  eq(serialEpisodeInteractions.userId, reviewRow.authorId),
                  eq(tvSeries.tmdbId, seriesTmdbId),
                  eq(serialEpisodeInteractions.seasonNumber, seasonNumber),
                  eq(serialEpisodeInteractions.episodeNumber, episodeNumber),
                ),
              )
              .limit(1)
          : db
              .select({ rating: serialSeasonInteractions.rating })
              .from(serialSeasonInteractions)
              .innerJoin(tvSeries, eq(serialSeasonInteractions.seriesId, tvSeries.id))
              .where(
                and(
                  eq(serialSeasonInteractions.userId, reviewRow.authorId),
                  eq(tvSeries.tmdbId, seriesTmdbId),
                  eq(serialSeasonInteractions.seasonNumber, seasonNumber),
                ),
              )
              .limit(1),
      ]);

      const seriesLabel = episodeNumber !== null
        ? `S${seasonNumber}E${episodeNumber}`
        : `Season ${seasonNumber}`;
      const seriesData = seriesRow[0];

      return {
        id: reviewRow.id,
        mediaType: "tv" as const,
        content: reviewRow.content,
        containsSpoilers: reviewRow.containsSpoilers,
        createdAt: reviewRow.createdAt,
        updatedAt: reviewRow.updatedAt,
        rating: interactionRow[0]?.rating ?? null,
        author: {
          id: reviewRow.authorId,
          username: reviewRow.authorUsername,
          displayUsername: reviewRow.authorDisplayUsername,
          image: reviewRow.authorImage,
          avatarUrl: reviewRow.authorAvatarUrl,
        },
        media: {
          tmdbId: seriesTmdbId,
          title: seriesData ? `${seriesData.title} · ${seriesLabel}` : `Unknown series · ${seriesLabel}`,
          posterPath: seriesData?.posterPath ?? null,
          releaseYear: seriesData?.releaseYear ?? null,
          genres: seriesData?.genres ?? [],
          director: null,
          creator: seriesData?.creator ?? null,
        },
        engagement: {
          likeCount: likeRow[0]?.count ?? 0,
          commentCount: commentRow[0]?.count ?? 0,
          viewerHasLiked: viewerUserId ? viewerLikeRow.length > 0 : null,
        },
      };
    }

    return null;
  }
}
