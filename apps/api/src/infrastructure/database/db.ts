import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeonHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../config/env";
import * as schema from "./entities";
import { configureLocalNeonProxy } from "./local-proxy";

// Tests/CI talk to a local Postgres directly over the wire protocol
// (DIRECT_DATABASE_URL) instead of through the Neon HTTP proxy that local
// dev uses. Two reasons: the proxy turns every query into its own HTTP
// round-trip (~7x slower for the hundreds of sequential queries an
// integration suite fires), and running the suite against Neon burns the
// Free plan's monthly egress quota. Test mode therefore refuses to fall
// back to the neon-http client - see createDb below.
//
// db is typed as the neon-http client everywhere in the app (the real
// production driver) - the node-postgres instance is cast into that same
// type. Both are plain Postgres-dialect query builders over the same
// schema with no .transaction() usage anywhere in this codebase, so this
// holds up at runtime; only the connection transport differs.
const directDatabaseUrl = process.env.DIRECT_DATABASE_URL;

const isNeonHost = (url: string): boolean => /\.neon\.tech(?:[:/?]|$)/i.test(url);

const createDb = () => {
  if (env.NODE_ENV === "test") {
    // Fail closed: the suite must hit a local Postgres, never Neon. Silently
    // falling through to the neon-http client here is what ran the whole
    // integration suite against the production DB and drained the Free plan's
    // egress quota (2026-09-08 investigation).
    if (!directDatabaseUrl) {
      throw new Error(
        "DIRECT_DATABASE_URL must be set when NODE_ENV=test. Start a local Postgres " +
          "(`docker compose up postgres`) and point DIRECT_DATABASE_URL at it - tests must never touch Neon.",
      );
    }
    if (isNeonHost(directDatabaseUrl)) {
      throw new Error(
        "DIRECT_DATABASE_URL points at a Neon host. Refusing to run the test suite against Neon - use a local Postgres.",
      );
    }
    return drizzleNodePostgres(new Pool({ connectionString: directDatabaseUrl }), {
      schema,
    }) as unknown as ReturnType<typeof drizzleNeonHttp<typeof schema>>;
  }

  if (env.USE_LOCAL_DB_PROXY) {
    configureLocalNeonProxy();
  }

  return drizzleNeonHttp(neon(env.DATABASE_URL), { schema });
};

export const db = createDb();
