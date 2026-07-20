import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

// docker-entrypoint.sh runs this instead of `drizzle-kit migrate` because
// drizzle-kit always picks the neon-serverless (WebSocket) driver whenever
// @neondatabase/serverless is a dependency, and that driver's handshake isn't
// compatible with docker-compose.yml's local HTTP proxy. Migrations need
// multi-statement, wire-protocol execution anyway, so this connects with
// plain `pg` straight to the postgres service - no proxy involved.
const connectionString = process.env.DIRECT_DATABASE_URL;
if (!connectionString) {
  throw new Error("DIRECT_DATABASE_URL is required to run Docker Compose migrations");
}

const pool = new Pool({ connectionString });
const db = drizzle(pool);

await migrate(db, { migrationsFolder: "./drizzle" });
await pool.end();
console.info("Docker Compose migrations applied.");
