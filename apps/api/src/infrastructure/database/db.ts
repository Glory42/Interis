import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "../config/env";
import * as schema from "./entities";
import { configureLocalNeonProxy } from "./local-proxy";

if (env.USE_LOCAL_DB_PROXY) {
  configureLocalNeonProxy();
}

const sql = neon(env.DATABASE_URL);
export const db = drizzle(sql, { schema });