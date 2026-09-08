-- One-off: remove all @example.com test accounts from PROD_DB.
-- Run inside a single transaction; the guard raises (=> full rollback)
-- unless exactly 18 real users remain and 0 test users are left.
--   psql "$PROD_DB" --single-transaction -v ON_ERROR_STOP=1 -f scripts/purge-test-users.sql

\echo '=== BEFORE ==='
SELECT count(*) AS users_total,
       count(*) FILTER (WHERE email LIKE '%@example.com') AS test_users,
       count(*) FILTER (WHERE email NOT LIKE '%@example.com') AS real_users
FROM "user";

\echo '=== DELETE (cascades to profile, diary, reviews, activity, follows, sessions, ...) ==='
DELETE FROM "user" WHERE email LIKE '%@example.com';

\echo '=== GUARD ==='
DO $$
DECLARE real_count int; test_left int;
BEGIN
  SELECT count(*) FILTER (WHERE email NOT LIKE '%@example.com'),
         count(*) FILTER (WHERE email LIKE '%@example.com')
    INTO real_count, test_left
  FROM "user";
  IF real_count <> 18 OR test_left <> 0 THEN
    RAISE EXCEPTION 'Guard failed: real_count=%, test_left=% - rolling back', real_count, test_left;
  END IF;
  RAISE NOTICE 'Guard passed: % real users remain, % test users left', real_count, test_left;
END $$;

\echo '=== AFTER (transaction commits on clean exit) ==='
SELECT count(*) AS users_total FROM "user";
SELECT split_part(email,'@',2) AS domain, count(*) FROM "user" GROUP BY 1 ORDER BY 2 DESC;
SELECT 'diary_entry' AS tbl, count(*) FROM diary_entry
UNION ALL SELECT 'review',             count(*) FROM review
UNION ALL SELECT 'activity',           count(*) FROM activity
UNION ALL SELECT 'movie_interaction',  count(*) FROM movie_interaction
UNION ALL SELECT 'list',               count(*) FROM list
UNION ALL SELECT 'post',               count(*) FROM post
UNION ALL SELECT 'report',             count(*) FROM report
UNION ALL SELECT 'movie (archive)',    count(*) FROM movie
UNION ALL SELECT 'tv_series (archive)',count(*) FROM tv_series
UNION ALL SELECT 'person (archive)',   count(*) FROM person;
