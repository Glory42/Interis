// Bun preload (see bunfig.toml [test].preload) - runs before any test file
// imports src/infrastructure/database/db.ts, so this is the only place that
// can safely redirect DATABASE_URL before that module reads it.
//
// This only matters for local dev. CI (.github/workflows/test-suite.yml)
// already runs tests against its own disposable Docker Postgres container -
// DATABASE_URL there is never the primary database, so there's nothing to
// redirect and devDATABASE_URL is never set.
//
// Locally, devDATABASE_URL in .env was previously dead configuration:
// nothing ever remapped it onto DATABASE_URL, so `bun test` always read
// whatever DATABASE_URL happened to resolve to - the primary database by
// default, or a stale value shadowed into the shell from an earlier
// command. Every integration test's seeded rows (movies, albums, tracks,
// users named "Test Artist" etc.) landed wherever DATABASE_URL pointed,
// with nothing stopping that from being the primary database real users/
// dev browsing hit.
if (process.env.devDATABASE_URL) {
  process.env.DATABASE_URL = process.env.devDATABASE_URL;
}
