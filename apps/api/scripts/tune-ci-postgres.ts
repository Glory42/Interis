import { Pool } from "pg";

// CI's postgres:16-alpine service container runs with its default
// checkpoint_timeout (5min) and max_wal_size (1GB) - fine for a normal app,
// but the E2E suite runs for 5-9 minutes, so a checkpoint always fires
// mid-run. Its write phase stalls disk I/O on the runner for 30-40s
// (confirmed via the container's own logs: "checkpoint complete: ...
// write=41.308 s ..."), which was intermittently blowing whatever request
// happened to be in flight past its test timeout - a different, otherwise
// unrelated spec each time, purely down to which one's teardown landed in
// that window.
//
// checkpoint_timeout/max_wal_size are both PGC_SIGHUP (reloadable without a
// restart), so this can push the checkpoint window out past the suite's
// total runtime without touching the service container's startup command
// at all - GitHub Actions' `services:` block has no supported way to pass
// postgres its own -c flags directly.
const connectionString = process.env.DIRECT_DATABASE_URL;
if (!connectionString) {
  throw new Error("DIRECT_DATABASE_URL is required to tune the CI postgres instance");
}

const pool = new Pool({ connectionString });

await pool.query("ALTER SYSTEM SET checkpoint_timeout = '30min'");
await pool.query("ALTER SYSTEM SET max_wal_size = '4GB'");
await pool.query("SELECT pg_reload_conf()");
await pool.end();

console.info("CI postgres checkpoint tuning applied.");
