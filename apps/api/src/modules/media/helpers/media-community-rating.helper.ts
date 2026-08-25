import { sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

type RatingRow = { userId: string; rating: number | null };

// Community rating source: every diary-entry rating (one per logged
// watch/rewatch, matching Letterboxd-style per-log averaging), plus the
// interaction (star-widget) rating for any user who rated the item that
// way WITHOUT ever logging a diary entry for it. A user's diary rating(s)
// take precedence over their interaction rating so the same opinion is
// never double-counted - mirrors the frontend's own precedence
// (interaction rating falls back to diary rating) for "Your Rating", just
// inverted for aggregation purposes. Shared between movies and serials
// since both apply the identical diary-vs-interaction precedence rule.
export const mergeCommunityRatings = (
  diaryRatingRows: RatingRow[],
  interactionRatingRows: RatingRow[],
): { rating: number }[] => {
  const usersWithDiaryRating = new Set(diaryRatingRows.map((row) => row.userId));
  const interactionOnlyRatingRows = interactionRatingRows.filter(
    (row) => !usersWithDiaryRating.has(row.userId),
  );

  return [
    ...diaryRatingRows.map((row) => ({ rating: row.rating as number })),
    ...interactionOnlyRatingRows.map((row) => ({ rating: row.rating as number })),
  ];
};

export type CommunityRatingAggregateSource = {
  diaryTableName: string;
  diaryEntityIdColumn: AnyPgColumn;
  diaryRatingColumn: AnyPgColumn;
  diaryUserIdColumn: AnyPgColumn;
  interactionTableName: string;
  interactionEntityIdColumn: AnyPgColumn;
  interactionRatingColumn: AnyPgColumn;
  interactionUserIdColumn: AnyPgColumn;
};

// The SQL-side twin of mergeCommunityRatings above - same diary-rating-wins,
// dedupe-by-user rule, expressed as a correlated-subquery fragment for
// archive listings that need the aggregate computed per row inside a SQL
// GROUP BY (mergeCommunityRatings itself is for single-item detail pages,
// which fetch rows and merge in JS instead - same rule, different execution
// shape driven by where the data is already being read).
export const buildCommunityRatingAggregateSql = (
  source: CommunityRatingAggregateSource,
  entityId: AnyPgColumn,
): { avgRatingOutOfTen: SQL<number | null>; ratedLogCount: SQL<number> } => {
  const mergedRatings = sql`(
    select ${source.diaryRatingColumn} as rating from ${sql.raw(source.diaryTableName)}
    where ${source.diaryEntityIdColumn} = ${entityId} and ${source.diaryRatingColumn} is not null
    union all
    select ${source.interactionRatingColumn} as rating from ${sql.raw(source.interactionTableName)}
    where ${source.interactionEntityIdColumn} = ${entityId} and ${source.interactionRatingColumn} is not null
      and not exists (
        select 1 from ${sql.raw(source.diaryTableName)}
        where ${source.diaryEntityIdColumn} = ${entityId}
          and ${source.diaryUserIdColumn} = ${source.interactionUserIdColumn}
      )
  )`;

  return {
    avgRatingOutOfTen: sql<number | null>`(select avg(r.rating)::double precision from ${mergedRatings} r)`,
    ratedLogCount: sql<number>`(select count(*)::int from ${mergedRatings} r)`,
  };
};
