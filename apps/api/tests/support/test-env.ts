// Bun loads .env before tests run; keep a developer's real R2/TMDB keys out, matching CI.
for (const key of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "R2_PUBLIC_URL"]) {
  delete process.env[key];
}
process.env.TMDB_ACCESS_TOKEN = "Bearer ci-test-placeholder";
