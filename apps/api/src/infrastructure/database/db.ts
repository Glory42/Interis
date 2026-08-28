import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeonHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../config/env";
import * as schema from "./entities";
import { configureLocalNeonProxy } from "./local-proxy";

// Tests/CI talk to the local Postgres container directly over the wire
// protocol instead of through the Neon HTTP proxy that local dev's
// docker-compose api/web containers use. The proxy translates every query
// into its own HTTP round-trip - fine for interactive dev traffic, but a
// severe bottleneck for the hundreds of sequential queries an integration
// suite fires (measured ~7x slower end-to-end than a direct connection).
//
// db is typed as the neon-http client everywhere in the app (the real
// production driver) - the node-postgres instance is cast into that same
// type. Both are plain Postgres-dialect query builders over the same
// schema with no .transaction() usage anywhere in this codebase, so this
// holds up at runtime; only the connection transport differs.
const directDatabaseUrl = process.env.DIRECT_DATABASE_URL;

const createDb = () => {
  if (env.NODE_ENV === "test" && directDatabaseUrl) {
    // pg's default pool max is 10, shared by the whole process. Playwright's
    // fullyParallel E2E run fires many concurrent requests at this one
    // backend, and Postgres (the CI job's own throwaway container) allows
    // 100 connections by default - plenty of headroom, so raise the app's
    // ceiling rather than leave requests queueing for a free connection
    // long enough to blow a test's timeout (this was the actual cause of
    // an intermittent DELETE /api/auth/account timeout in CI - not a slow
    // query, but the connection never being acquired in time under load).
    return drizzleNodePostgres(
      new Pool({ connectionString: directDatabaseUrl, max: 30 }),
      { schema },
    ) as unknown as ReturnType<typeof drizzleNeonHttp<typeof schema>>;
  }

  if (env.USE_LOCAL_DB_PROXY) {
    configureLocalNeonProxy();
  }

  return drizzleNeonHttp(neon(env.DATABASE_URL), { schema });
};

export const db = createDb();
