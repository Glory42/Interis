import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeonHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../config/env";
import { configureLocalNeonProxy } from "./local-proxy";

// Tests/CI bypass the Neon HTTP proxy (~7x slower for the hundreds of
// sequential queries an integration suite fires) and talk to Postgres
// directly over the wire protocol instead.
//
// db is typed as the neon-http client everywhere - the node-postgres
// instance is cast into that same type. Both are plain Postgres query
// builders with no .transaction() usage anywhere, so this holds at runtime.
const directDatabaseUrl = process.env.DIRECT_DATABASE_URL;

// No `schema` object passed to drizzle() here: this codebase never uses
// drizzle's relational query API (db.query.*), only the plain query builder,
// which doesn't need it.
const createDb = () => {
  if (env.NODE_ENV === "test" && directDatabaseUrl) {
    return drizzleNodePostgres(
      new Pool({ connectionString: directDatabaseUrl }),
    ) as unknown as ReturnType<typeof drizzleNeonHttp>;
  }

  if (env.USE_LOCAL_DB_PROXY) {
    configureLocalNeonProxy();
  }

  return drizzleNeonHttp(neon(env.DATABASE_URL));
};

export const db = createDb();
