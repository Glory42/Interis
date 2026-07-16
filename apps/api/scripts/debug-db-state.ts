import { Client } from "pg";

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const tables = await client.query(
  `SELECT schemaname, tablename FROM pg_tables WHERE schemaname IN ('public', 'drizzle') ORDER BY schemaname, tablename`,
);
console.info("=== tables ===");
console.table(tables.rows);

const migrationsTableExists = tables.rows.some(
  (row: { schemaname: string; tablename: string }) =>
    row.schemaname === "drizzle" && row.tablename === "__drizzle_migrations",
);

if (migrationsTableExists) {
  const migrations = await client.query(
    `SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at`,
  );
  console.info("=== drizzle.__drizzle_migrations ===");
  console.table(migrations.rows);
} else {
  console.info("=== drizzle.__drizzle_migrations does not exist ===");
}

await client.end();
