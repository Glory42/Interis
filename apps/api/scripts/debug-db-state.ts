import { Client } from "pg";

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

if (process.argv.includes("--revert-backfill")) {
  const deleted = await client.query(`DELETE FROM drizzle.__drizzle_migrations`);
  console.info(`Deleted ${deleted.rowCount} row(s) from drizzle.__drizzle_migrations.`);
}

const columns = await client.query(
  `SELECT table_name, column_name, data_type
   FROM information_schema.columns
   WHERE table_schema = 'public'
   ORDER BY table_name, ordinal_position`,
);
console.info("=== columns per table ===");
console.table(columns.rows);

const migrationsTableExists = await client.query(
  `SELECT to_regclass('drizzle.__drizzle_migrations') IS NOT NULL AS exists`,
);
if (migrationsTableExists.rows[0].exists) {
  const migrations = await client.query(
    `SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations`,
  );
  console.info(`=== drizzle.__drizzle_migrations row count: ${migrations.rows[0].count} ===`);
} else {
  console.info("=== drizzle.__drizzle_migrations does not exist ===");
}

await client.end();
