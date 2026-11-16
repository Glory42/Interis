import { and, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { profiles } from "../../users/users.entity";
import { reviews } from "../../reviews/reviews.entity";
import { films } from "../../films/films.entity";
import {
  seriesDiaryEntries,
  seriesEpisodeInteractions,
  seriesSeasonInteractions,
  tvSeries,
} from "../../tv/tv.entity";
import { diaryEntries } from "../../diary/diary.entity";
import { lists } from "../../lists/lists.entity";
import { YourRatingRepository } from "../../media-interactions/repositories/your-rating.repository";
import {
  TV_EPISODE_REVIEW_TYPE,
  TV_SEASON_REVIEW_TYPE,
} from "../../reviews/constants/review-media-type.constant";

const LIST_STRIP_POSTERS = 5;
const PROFILE_FAVORITES = 4;

// The n-th ":"-separated part of a review's media source id as an int, or null when it isn't one.
const sourceIdPart = (n: number) =>
  sql<number | null>`case when split_part(${reviews.mediaSourceId}, ':', ${n}) ~ '^[0-9]{1,9}$'
    then split_part(${reviews.mediaSourceId}, ':', ${n})::int end`;

const isTvReview = sql`${reviews.mediaType} in ('tv', ${TV_SEASON_REVIEW_TYPE}, ${TV_EPISODE_REVIEW_TYPE})`;

const authorUser = alias(user, "share_author");

// Single-query reads for link previews and share cards; nothing here writes.
export class PublicShareRepository {
  static async findReview(reviewId: string) {
    const [row] = await db
      .select({
        id: reviews.id,
        content: reviews.content,
        containsSpoilers: reviews.containsSpoilers,
        mediaType: reviews.mediaType,
        updatedAt: reviews.updatedAt,
        authorUsername: user.username,
        authorDisplayUsername: user.displayUsername,
        authorAvatarUrl: profiles.avatarUrl,
        seriesTmdbId: sourceIdPart(1),
        seasonNumber: sourceIdPart(2),
        episodeNumber: sourceIdPart(3),
        filmTmdbId: films.tmdbId,
        filmTitle: films.title,
        filmYear: films.releaseYear,
        filmPosterPath: films.posterPath,
        filmBackdropPath: films.backdropPath,
        seriesTitle: tvSeries.title,
        seriesYear: tvSeries.firstAirYear,
        seriesPosterPath: tvSeries.posterPath,
        seriesBackdropPath: tvSeries.backdropPath,
        filmLogRating: diaryEntries.rating,
        seriesLogRating: seriesDiaryEntries.rating,
        seasonRating: seriesSeasonInteractions.rating,
        episodeRating: seriesEpisodeInteractions.rating,
      })
      .from(reviews)
      .innerJoin(user, eq(reviews.userId, user.id))
      .leftJoin(profiles, eq(profiles.userId, user.id))
      .leftJoin(films, eq(films.id, reviews.movieId))
      .leftJoin(tvSeries, and(isTvReview, eq(tvSeries.tmdbId, sourceIdPart(1))))
      .leftJoin(diaryEntries, eq(diaryEntries.id, reviews.diaryEntryId))
      .leftJoin(seriesDiaryEntries, eq(seriesDiaryEntries.id, reviews.serialDiaryEntryId))
      .leftJoin(
        seriesSeasonInteractions,
        and(
          eq(reviews.mediaType, TV_SEASON_REVIEW_TYPE),
          eq(seriesSeasonInteractions.userId, reviews.userId),
          eq(seriesSeasonInteractions.seriesId, tvSeries.id),
          eq(seriesSeasonInteractions.seasonNumber, sourceIdPart(2)),
        ),
      )
      .leftJoin(
        seriesEpisodeInteractions,
        and(
          eq(reviews.mediaType, TV_EPISODE_REVIEW_TYPE),
          eq(seriesEpisodeInteractions.userId, reviews.userId),
          eq(seriesEpisodeInteractions.seriesId, tvSeries.id),
          eq(seriesEpisodeInteractions.seasonNumber, sourceIdPart(2)),
          eq(seriesEpisodeInteractions.episodeNumber, sourceIdPart(3)),
        ),
      )
      .where(eq(reviews.id, reviewId))
      .limit(1);

    return row ?? null;
  }

  static async findProfile(username: string) {
    const [row] = await db
      .select({
        username: user.username,
        displayUsername: user.displayUsername,
        bio: profiles.bio,
        avatarUrl: profiles.avatarUrl,
        updatedAt: profiles.updatedAt,
        filmLogCount: sql<number>`(select count(*)::int from diary_entry d where d.user_id = ${user.id})`,
        seriesLogCount: sql<number>`(select count(*)::int from serial_diary_entry d where d.user_id = ${user.id})`,
        reviewCount: sql<number>`(select count(*)::int from review r where r.user_id = ${user.id})`,
        followerCount: sql<number>`(select count(*)::int from follow f where f.following_id = ${user.id})`,
        favoritePosterPaths: sql<string[]>`array(
          select p.poster_path from profile_top_pick p
          where p.user_id = ${user.id} and p.poster_path is not null
          order by p.category_id, p.slot limit ${PROFILE_FAVORITES})`,
      })
      .from(profiles)
      .innerJoin(user, eq(profiles.userId, user.id))
      .where(eq(user.username, username))
      .limit(1);

    return row ?? null;
  }

  // Public Lists only: a private List is as invisible here as it is to a signed-out viewer in-app.
  static async findPublicList(listId: string) {
    const [row] = await db
      .select({
        id: lists.id,
        title: lists.title,
        description: lists.description,
        isRanked: lists.isRanked,
        updatedAt: lists.updatedAt,
        ownerUsername: authorUser.username,
        ownerDisplayUsername: authorUser.displayUsername,
        ownerAvatarUrl: profiles.avatarUrl,
        entryCount: sql<number>`(select count(*)::int from list_entry e where e.list_id = ${lists.id})`,
        posterPaths: sql<string[]>`array(
          select coalesce(m.poster_path, s.poster_path) from list_entry e
          left join movie m on m.id = e.movie_id
          left join tv_series s on s.id = e.tv_series_id
          where e.list_id = ${lists.id} and coalesce(m.poster_path, s.poster_path) is not null
          order by e.position limit ${LIST_STRIP_POSTERS})`,
      })
      .from(lists)
      .innerJoin(authorUser, eq(lists.userId, authorUser.id))
      .leftJoin(profiles, eq(profiles.userId, authorUser.id))
      .where(and(eq(lists.id, listId), eq(lists.isPublic, true)))
      .limit(1);

    return row ?? null;
  }

  static async getCommunityRating(mediaType: "movie" | "tv", tmdbId: number) {
    const table = mediaType === "movie" ? films : tvSeries;
    const aggregate = YourRatingRepository.communityAggregateSql(mediaType, table.id);
    const [row] = await db
      .select({ average: aggregate.avgRatingOutOfTen, count: aggregate.ratedLogCount })
      .from(table)
      .where(eq(table.tmdbId, tmdbId))
      .limit(1);

    return row && row.count > 0 && row.average !== null ? Number(row.average) : null;
  }
}
