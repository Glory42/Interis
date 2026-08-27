// Bun preload (see bunfig.toml [test].preload) - runs before any test file
// imports src/infrastructure/database/db.ts, so this is the only place that
// can safely redirect DATABASE_URL before that module reads it.
//
// devDATABASE_URL in .env was previously dead configuration: nothing ever
// remapped it onto DATABASE_URL, so `bun test` always read whatever
// DATABASE_URL happened to resolve to - the primary database by default, or
// a stale value shadowed into the shell from an earlier command. Either way,
// every integration test's seeded rows (movies, albums, tracks, users named
// "Test Artist" etc.) landed wherever DATABASE_URL pointed, with nothing
// stopping that from being the primary database real users/dev browsing hit.
if (process.env.devDATABASE_URL) {
  process.env.DATABASE_URL = process.env.devDATABASE_URL;
} else {
  throw new Error(
    "devDATABASE_URL is not set - refusing to run tests without a dedicated test database " +
      "(set it in apps/api/.env, separate from DATABASE_URL).",
  );
}
