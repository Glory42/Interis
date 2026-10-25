import { sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

type RatingRow = { userId: string; rating: number | null };

// Community rating source: each user counts once, with what their own "Your
// rating" shows - the star rating, else their latest rated log (#92). A
// rated log sets the star rating (#91), so this is their newest opinion, and
// rewatches don't weigh a user more than once. Shared between movies and
// serials. `diaryRatingRows` must come latest watch first.
export const mergeCommunityRatings = (
  diaryRatingRows: RatingRow[],
  interactionRatingRows: RatingRow[],
): { rating: number }[] => {
  const ratingByUser = new Map<string, number>();
  for (const row of interactionRatingRows) {
    if (row.rating !== null) ratingByUser.set(row.userId, row.rating);
  }
  for (const row of diaryRatingRows) {
    if (row.rating !== null && !ratingByUser.has(row.userId)) {
      ratingByUser.set(row.userId, row.rating);
    }
  }

  return [...ratingByUser.values()].map((rating) => ({ rating }));
};

export type CommunityRatingAggregateSource = {
  diaryTableName: string;
  diaryEntityIdColumn: AnyPgColumn;
  diaryRatingColumn: AnyPgColumn;
  diaryUserIdColumn: AnyPgColumn;
  diaryWatchedDateColumn: AnyPgColumn;
  diaryCreatedAtColumn: AnyPgColumn;
  interactionTableName: string;
  interactionEntityIdColumn: AnyPgColumn;
  interactionRatingColumn: AnyPgColumn;
  interactionUserIdColumn: AnyPgColumn;
};

// The SQL-side twin of mergeCommunityRatings above - same one-rating-per-user
// rule, expressed as a correlated-subquery fragment for archive listings that
// need the aggregate computed per row inside a SQL GROUP BY
// (mergeCommunityRatings itself is for single-item detail pages, which fetch
// rows and merge in JS instead).
export const buildCommunityRatingAggregateSql = (
  source: CommunityRatingAggregateSource,
  entityId: AnyPgColumn,
): { avgRatingOutOfTen: SQL<number | null>; ratedLogCount: SQL<number> } => {
  const interactionTable = sql.raw(source.interactionTableName);
  const diaryTable = sql.raw(source.diaryTableName);
  const mergedRatings = sql`(
    select ${source.interactionRatingColumn} as rating from ${interactionTable}
    where ${source.interactionEntityIdColumn} = ${entityId} and ${source.interactionRatingColumn} is not null
    union all
    (
      select distinct on (${source.diaryUserIdColumn}) ${source.diaryRatingColumn} as rating
      from ${diaryTable}
      where ${source.diaryEntityIdColumn} = ${entityId} and ${source.diaryRatingColumn} is not null
        and not exists (
          select 1 from ${interactionTable}
          where ${source.interactionEntityIdColumn} = ${entityId}
            and ${source.interactionUserIdColumn} = ${source.diaryUserIdColumn}
            and ${source.interactionRatingColumn} is not null
        )
      order by ${source.diaryUserIdColumn}, ${source.diaryWatchedDateColumn} desc,
        ${source.diaryCreatedAtColumn} desc
    )
  )`;

  return {
    avgRatingOutOfTen: sql<number | null>`(select avg(r.rating)::double precision from ${mergedRatings} r)`,
    ratedLogCount: sql<number>`(select count(*)::int from ${mergedRatings} r)`,
  };
};
