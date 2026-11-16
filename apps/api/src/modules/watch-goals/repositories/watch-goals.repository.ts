import { and, eq, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { watchGoals } from "../watch-goals.entity";

export type WatchGoalYear = { year: number; targetFilms: number; targetSeries: number | null };

type ProgressRow = {
  target_films: number | null;
  target_series: number | null;
  updated_at: string | Date | null;
  films_watched: number;
  series_watched: number;
};

// Distinct titles with a Diary Entry dated in the year: rewatches count once.
const countsFor = (userId: string, year: number) => {
  const start = `${year}-01-01`;
  const end = `${year + 1}-01-01`;
  return sql`
    (SELECT count(DISTINCT movie_id)::int FROM diary_entry
      WHERE user_id = ${userId} AND watched_date >= ${start}::date AND watched_date < ${end}::date) AS films_watched,
    (SELECT count(DISTINCT series_id)::int FROM serial_diary_entry
      WHERE user_id = ${userId} AND watched_date >= ${start}::date AND watched_date < ${end}::date) AS series_watched`;
};

export class WatchGoalsRepository {
  // The year's goal (if any), its progress and every year with a goal, in one round trip.
  static async findWithProgress(userId: string, year: number) {
    const result = await db.execute<ProgressRow & { years: WatchGoalYear[] }>(sql`
      SELECT g.target_films, g.target_series, g.updated_at, ${countsFor(userId, year)},
        (SELECT coalesce(json_agg(json_build_object(
            'year', y.year, 'targetFilms', y.target_films, 'targetSeries', y.target_series
          ) ORDER BY y.year DESC), '[]'::json)
          FROM watch_goal y WHERE y.user_id = ${userId}) AS years
      FROM (SELECT 1) AS one
      LEFT JOIN watch_goal g ON g.user_id = ${userId} AND g.year = ${year}
    `);
    const row = result.rows[0];
    return {
      targetFilms: row?.target_films ?? null,
      targetSeries: row?.target_series ?? null,
      updatedAt: row?.updated_at ? new Date(row.updated_at) : null,
      filmsWatched: Number(row?.films_watched ?? 0),
      seriesWatched: Number(row?.series_watched ?? 0),
      years: row?.years ?? [],
    };
  }

  // Counts only when the user has a goal for the year; no row otherwise.
  static async findGoalProgress(userId: string, year: number) {
    const result = await db.execute<ProgressRow>(sql`
      SELECT g.target_films, g.target_series, g.updated_at, ${countsFor(userId, year)}
      FROM watch_goal g
      WHERE g.user_id = ${userId} AND g.year = ${year}
    `);
    const row = result.rows[0];
    if (!row || row.target_films === null) return null;
    return {
      targetFilms: row.target_films,
      targetSeries: row.target_series,
      filmsWatched: Number(row.films_watched),
      seriesWatched: Number(row.series_watched),
    };
  }

  static async upsert(userId: string, year: number, targetFilms: number, targetSeries: number | null) {
    const [row] = await db
      .insert(watchGoals)
      .values({ userId, year, targetFilms, targetSeries })
      .onConflictDoUpdate({
        target: [watchGoals.userId, watchGoals.year],
        set: { targetFilms, targetSeries, updatedAt: new Date() },
      })
      .returning({
        year: watchGoals.year,
        targetFilms: watchGoals.targetFilms,
        targetSeries: watchGoals.targetSeries,
        updatedAt: watchGoals.updatedAt,
      });
    return row ?? null;
  }

  static async delete(userId: string, year: number): Promise<boolean> {
    const deleted = await db
      .delete(watchGoals)
      .where(and(eq(watchGoals.userId, userId), eq(watchGoals.year, year)))
      .returning({ id: watchGoals.id });
    return deleted.length > 0;
  }
}
