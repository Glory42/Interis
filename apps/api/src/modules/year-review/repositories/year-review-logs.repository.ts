import { sql, type SQL } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { YourRatingRepository } from "../../media-interactions/repositories/your-rating.repository";
import type { YearReviewRankedTitle, YearReviewTitle, YearTotals } from "../types/year-review.types";

type DayRange = { start: string; end: string };

export const yearRange = (year: number): DayRange => ({ start: `${year}-01-01`, end: `${year + 1}-01-01` });

// Every Diary Entry dated in the range (Films and Series), with the cached title it logs.
const yearLogsCte = (userId: string, { start, end }: DayRange) => sql`logs AS (
  SELECT 'movie'::text AS media_type, d.movie_id AS media_id, m.tmdb_id, m.title, m.poster_path,
    m.release_year, m.genres, m.director, d.watched_date, d.created_at, d.rating, d.rewatch
  FROM diary_entry d JOIN movie m ON m.id = d.movie_id
  WHERE d.user_id = ${userId} AND d.watched_date >= ${start}::date AND d.watched_date < ${end}::date
  UNION ALL
  SELECT 'tv'::text, s.series_id, t.tmdb_id, t.title, t.poster_path,
    t.first_air_year, t.genres, NULL::text, s.watched_date, s.created_at, s.rating, s.rewatch
  FROM serial_diary_entry s JOIN tv_series t ON t.id = s.series_id
  WHERE s.user_id = ${userId} AND s.watched_date >= ${start}::date AND s.watched_date < ${end}::date
)`;

const TITLE_COLUMNS = sql.raw(
  `media_type AS "mediaType", tmdb_id AS "tmdbId", title, poster_path AS "posterPath", release_year AS "releaseYear"`,
);

// A JSON array of `rows` (a subquery with an `ord` column) in `ord` order, without `ord`.
const orderedJson = (rows: SQL) =>
  sql`(SELECT coalesce(jsonb_agg(to_jsonb(x) - 'ord' ORDER BY x.ord), '[]'::jsonb) FROM (${rows}) x)`;

// Film logs (runtime per log, rewatches again), Series logs, and episodes ticked in the range.
const totalsSelect = (userId: string, year: number) => {
  const { start, end } = yearRange(year);
  return sql`
    SELECT ${year}::int AS year, f.*, s.*, e.*
    FROM (
      SELECT count(DISTINCT d.movie_id)::int AS films, count(*)::int AS film_logs,
        count(*) FILTER (WHERE d.rewatch)::int AS film_rewatches, coalesce(sum(m.runtime), 0)::int AS film_minutes
      FROM diary_entry d JOIN movie m ON m.id = d.movie_id
      WHERE d.user_id = ${userId} AND d.watched_date >= ${start}::date AND d.watched_date < ${end}::date
    ) f, (
      SELECT count(DISTINCT series_id)::int AS series, count(*)::int AS series_logs,
        count(*) FILTER (WHERE rewatch)::int AS series_rewatches
      FROM serial_diary_entry
      WHERE user_id = ${userId} AND watched_date >= ${start}::date AND watched_date < ${end}::date
    ) s, (
      SELECT count(*)::int AS episodes, coalesce(sum(t.episode_runtime), 0)::int AS episode_minutes
      FROM serial_episode_interaction e JOIN tv_series t ON t.id = e.series_id
      WHERE e.user_id = ${userId} AND e.watched AND NOT e.watched_implicitly
        AND e.updated_at >= ${start}::timestamp AND e.updated_at < ${end}::timestamp
    ) e`;
};

type TotalsRow = {
  year: number;
  films: number;
  film_logs: number;
  film_rewatches: number;
  film_minutes: number;
  series: number;
  series_logs: number;
  series_rewatches: number;
  episodes: number;
  episode_minutes: number;
};

const toTotals = (row: TotalsRow | undefined): YearTotals => ({
  films: Number(row?.films ?? 0),
  series: Number(row?.series ?? 0),
  filmLogs: Number(row?.film_logs ?? 0),
  seriesLogs: Number(row?.series_logs ?? 0),
  rewatchLogs: Number(row?.film_rewatches ?? 0) + Number(row?.series_rewatches ?? 0),
  filmMinutes: Number(row?.film_minutes ?? 0),
  episodes: Number(row?.episodes ?? 0),
  episodeMinutes: Number(row?.episode_minutes ?? 0),
});

type DatedTitle = YearReviewTitle & { watchedDate: string };

type SpotlightReviewRow = {
  id: string;
  content: string;
  containsSpoilers: boolean;
};

// Aggregate reads over one user's Diary Entries in one calendar year; each is one statement.
export class YearReviewLogsRepository {
  // The year's totals and the previous year's, in one round trip.
  static async getTotals(userId: string, year: number) {
    const result = await db.execute<TotalsRow>(
      sql`${totalsSelect(userId, year)} UNION ALL ${totalsSelect(userId, year - 1)}`,
    );
    const byYear = new Map(result.rows.map((row) => [Number(row.year), row]));
    return { current: toTotals(byYear.get(year)), previous: toTotals(byYear.get(year - 1)) };
  }

  // Logs per day and per month, and the longest run of consecutive days with a log.
  static async getCalendar(userId: string, year: number) {
    const range = yearRange(year);
    const result = await db.execute<{
      days: { day: string; count: number }[];
      months: { month: number; count: number }[];
      streak: { days: number; start: string; end: string } | null;
    }>(sql`
      WITH ${yearLogsCte(userId, range)},
      days AS (SELECT watched_date AS day, count(*)::int AS count FROM logs GROUP BY watched_date),
      -- Consecutive days share day minus its rank (gaps and islands).
      islands AS (SELECT day, day - (row_number() OVER (ORDER BY day))::int AS island FROM days)
      SELECT
        (SELECT coalesce(json_agg(json_build_object('day', to_char(day, 'YYYY-MM-DD'), 'count', count) ORDER BY day), '[]'::json)
          FROM days) AS days,
        (SELECT coalesce(json_agg(json_build_object('month', month, 'count', count) ORDER BY month), '[]'::json)
          FROM (SELECT extract(month FROM day)::int AS month, sum(count)::int AS count FROM days GROUP BY 1) m) AS months,
        (SELECT json_build_object('days', count(*)::int, 'start', to_char(min(day), 'YYYY-MM-DD'), 'end', to_char(max(day), 'YYYY-MM-DD'))
          FROM islands GROUP BY island ORDER BY count(*) DESC, min(day) DESC LIMIT 1) AS streak
    `);
    const row = result.rows[0];
    return { days: row?.days ?? [], months: row?.months ?? [], streak: row?.streak ?? null };
  }

  // First and last watch, ranked titles, the most rewatched one, card posters,
  // the spotlight review, and the Community Rating of the titles rated that year.
  static async getHighlights(userId: string, year: number) {
    const range = yearRange(year);
    const community = (mediaType: "movie" | "tv") =>
      YourRatingRepository.communityAggregateSql(mediaType, sql`pt.media_id`).avgRatingOutOfTen;
    const result = await db.execute<{
      first_watch: DatedTitle | null;
      last_watch: DatedTitle | null;
      top_rated: (YearReviewTitle & { rating: number })[];
      top_films: YearReviewRankedTitle[];
      top_series: YearReviewRankedTitle[];
      most_rewatched: (YearReviewTitle & { logCount: number }) | null;
      top_film_review: SpotlightReviewRow | null;
      high_ratings: number;
      poster_paths: string[];
      community_average: number | null;
    }>(sql`
      WITH ${yearLogsCte(userId, range)},
      per_title AS (
        SELECT media_type, media_id, tmdb_id, title, poster_path, release_year,
          max(rating) AS best_rating, count(*)::int AS log_count, max(watched_date) AS last_watched
        FROM logs GROUP BY media_type, media_id, tmdb_id, title, poster_path, release_year
      )
      SELECT
        (SELECT row_to_json(f) FROM (
          SELECT ${TITLE_COLUMNS}, to_char(watched_date, 'YYYY-MM-DD') AS "watchedDate"
          FROM logs ORDER BY watched_date, created_at LIMIT 1) f) AS first_watch,
        (SELECT row_to_json(l) FROM (
          SELECT ${TITLE_COLUMNS}, to_char(watched_date, 'YYYY-MM-DD') AS "watchedDate"
          FROM logs ORDER BY watched_date DESC, created_at DESC LIMIT 1) l) AS last_watch,
        ${orderedJson(sql`
          SELECT ${TITLE_COLUMNS}, best_rating AS rating,
            row_number() OVER (ORDER BY best_rating DESC, log_count DESC, last_watched DESC) AS ord
          FROM per_title WHERE best_rating IS NOT NULL ORDER BY ord LIMIT 5`)} AS top_rated,
        ${orderedJson(sql`
          SELECT ${TITLE_COLUMNS}, best_rating AS rating, log_count AS "logCount",
            to_char(last_watched, 'YYYY-MM-DD') AS "watchedDate",
            row_number() OVER (ORDER BY best_rating DESC NULLS LAST, log_count DESC, last_watched DESC) AS ord
          FROM per_title WHERE media_type = 'movie' ORDER BY ord LIMIT 5`)} AS top_films,
        ${orderedJson(sql`
          SELECT ${TITLE_COLUMNS}, best_rating AS rating, log_count AS "logCount",
            to_char(last_watched, 'YYYY-MM-DD') AS "watchedDate",
            row_number() OVER (ORDER BY best_rating DESC NULLS LAST, log_count DESC, last_watched DESC) AS ord
          FROM per_title WHERE media_type = 'tv' ORDER BY ord LIMIT 5`)} AS top_series,
        (SELECT row_to_json(r) FROM (
          SELECT ${TITLE_COLUMNS}, log_count AS "logCount"
          FROM per_title WHERE log_count >= 2 ORDER BY log_count DESC, last_watched DESC LIMIT 1) r) AS most_rewatched,
        (SELECT count(*)::int FROM per_title WHERE best_rating >= 9) AS high_ratings,
        (SELECT row_to_json(r) FROM (
          SELECT r.id, r.content, r.contains_spoilers AS "containsSpoilers"
          FROM review r
          JOIN movie m ON m.id = r.movie_id
          WHERE r.user_id = ${userId}
            AND m.tmdb_id = (
              SELECT tmdb_id FROM per_title WHERE media_type = 'movie'
              ORDER BY best_rating DESC NULLS LAST, log_count DESC, last_watched DESC LIMIT 1
            )
            AND r.created_at >= ${range.start}::timestamp AND r.created_at < ${range.end}::timestamp
          ORDER BY r.created_at DESC LIMIT 1
        ) r) AS top_film_review,
        (SELECT coalesce(json_agg(p.poster_path ORDER BY p.ord), '[]'::json) FROM (
          SELECT poster_path,
            row_number() OVER (ORDER BY best_rating DESC NULLS LAST, log_count DESC, last_watched DESC) AS ord
          FROM per_title WHERE poster_path IS NOT NULL ORDER BY ord LIMIT 18) p) AS poster_paths,
        (SELECT avg(CASE WHEN pt.media_type = 'movie' THEN ${community("movie")} ELSE ${community("tv")} END)
          FROM per_title pt WHERE pt.best_rating IS NOT NULL) AS community_average
    `);
    const row = result.rows[0];
    return {
      firstWatch: row?.first_watch ?? null,
      lastWatch: row?.last_watch ?? null,
      topRated: (row?.top_rated ?? []).map((title) => ({ ...title, rating: Number(title.rating) })),
      topFilms: (row?.top_films ?? []).map((title) => ({
        ...title,
        rating: title.rating === null || title.rating === undefined ? null : Number(title.rating),
        logCount: Number(title.logCount),
      })),
      topSeries: (row?.top_series ?? []).map((title) => ({
        ...title,
        rating: title.rating === null || title.rating === undefined ? null : Number(title.rating),
        logCount: Number(title.logCount),
      })),
      mostRewatched: row?.most_rewatched ?? null,
      topFilmReview: row?.top_film_review ?? null,
      highRatings: Number(row?.high_ratings ?? 0),
      posterPaths: row?.poster_paths ?? [],
      communityAverage: row?.community_average === null || row?.community_average === undefined
        ? null
        : Number(row.community_average),
    };
  }

  // Top genres (Films and Series), directors (Films) with up to three of
  // their titles, decades, the median release year, and distinct counts.
  static async getTaste(userId: string, year: number) {
    const range = yearRange(year);
    const result = await db.execute<{
      genres: { genre: string; count: number }[];
      directors: { director: string; count: number; slug: string | null; titles: YearReviewTitle[] }[];
      decades: { decade: number; count: number }[];
      rated_logs: number;
      average_rating: number | null;
      release_year_median: number | null;
      distinct_genres: number;
      distinct_directors: number;
    }>(sql`
      WITH ${yearLogsCte(userId, range)},
      titles AS (
        SELECT DISTINCT ON (media_type, media_id) media_type, genres, director, release_year, tmdb_id, title, poster_path
        FROM logs ORDER BY media_type, media_id
      )
      SELECT
        ${orderedJson(sql`
          SELECT g ->> 'name' AS genre, count(*)::int AS count,
            row_number() OVER (ORDER BY count(*) DESC, g ->> 'name') AS ord
          FROM titles,
            jsonb_array_elements(CASE WHEN jsonb_typeof(titles.genres) = 'array' THEN titles.genres ELSE '[]'::jsonb END) g
          WHERE g ->> 'name' IS NOT NULL
          GROUP BY g ->> 'name' ORDER BY ord LIMIT 5`)} AS genres,
        ${orderedJson(sql`
          SELECT dc.director, dc.count, p.slug, dc.ord,
            ${orderedJson(sql`
              SELECT media_type AS "mediaType", tmdb_id AS "tmdbId", title, poster_path AS "posterPath",
                release_year AS "releaseYear",
                row_number() OVER (ORDER BY release_year DESC NULLS LAST, title) AS ord
              FROM titles t
              WHERE t.director = dc.director AND t.media_type = 'movie'
              ORDER BY ord LIMIT 3`)} AS titles
          FROM (
            SELECT director, count(*)::int AS count, row_number() OVER (ORDER BY count(*) DESC, director) AS ord
            FROM titles WHERE media_type = 'movie' AND director IS NOT NULL AND director <> ''
            GROUP BY director ORDER BY ord LIMIT 5
          ) dc
          LEFT JOIN LATERAL (SELECT slug FROM person WHERE lower(person.name) = lower(dc.director) LIMIT 1) p ON true`)}
          AS directors,
        ${orderedJson(sql`
          SELECT (release_year / 10) * 10 AS decade, count(*)::int AS count, (release_year / 10) * 10 AS ord
          FROM titles WHERE release_year IS NOT NULL GROUP BY 1`)} AS decades,
        (SELECT count(rating)::int FROM logs) AS rated_logs,
        (SELECT avg(rating)::double precision FROM logs) AS average_rating,
        (SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY release_year)
          FROM titles WHERE release_year IS NOT NULL) AS release_year_median,
        (SELECT count(DISTINCT g ->> 'name')::int
          FROM titles,
            jsonb_array_elements(CASE WHEN jsonb_typeof(titles.genres) = 'array' THEN titles.genres ELSE '[]'::jsonb END) g
          WHERE g ->> 'name' IS NOT NULL) AS distinct_genres,
        (SELECT count(DISTINCT director)::int
          FROM titles WHERE media_type = 'movie' AND director IS NOT NULL AND director <> '') AS distinct_directors
    `);
    const row = result.rows[0];
    return {
      topGenres: row?.genres ?? [],
      topDirectors: (row?.directors ?? []).map((director) => ({
        ...director,
        count: Number(director.count),
        titles: director.titles ?? [],
      })),
      decades: row?.decades ?? [],
      ratedLogs: Number(row?.rated_logs ?? 0),
      averageRating: row?.average_rating === null || row?.average_rating === undefined ? null : Number(row.average_rating),
      releaseYearMedian:
        row?.release_year_median === null || row?.release_year_median === undefined
          ? null
          : Number(row.release_year_median),
      distinctGenres: Number(row?.distinct_genres ?? 0),
      distinctDirectors: Number(row?.distinct_directors ?? 0),
    };
  }
}
