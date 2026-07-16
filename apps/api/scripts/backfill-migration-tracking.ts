import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { Client } from "pg";

// One-time fix: DEVDATABASE_URL's schema was created by some path other than
// `drizzle-kit migrate` (drizzle.__drizzle_migrations exists but has zero
// rows, while every application table already exists), so migrate() tries
// to replay from migration 0000 and collides with the schema that's already
// there. Backfills the tracking table with exactly the rows a real
// `drizzle-kit migrate` history would contain, using the same hash/timestamp
// scheme drizzle-orm's migrator itself uses (see node_modules/drizzle-orm/
// migrator.js's readMigrationFiles and pg-core/dialect.js's migrate), so
// future `drizzle-kit migrate` runs correctly recognize everything through
// the current migration set as already applied.
const migrationsFolder = "./drizzle";

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const existing = await client.query(
  `SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations`,
);
if (existing.rows[0].count > 0) {
  console.info(
    `drizzle.__drizzle_migrations already has ${existing.rows[0].count} row(s) - refusing to backfill twice.`,
  );
  await client.end();
  process.exit(1);
}

const journal = JSON.parse(
  readFileSync(`${migrationsFolder}/meta/_journal.json`, "utf8"),
) as { entries: { tag: string; when: number }[] };

for (const entry of journal.entries) {
  const query = readFileSync(`${migrationsFolder}/${entry.tag}.sql`, "utf8");
  const hash = createHash("sha256").update(query).digest("hex");

  await client.query(
    `INSERT INTO drizzle.__drizzle_migrations ("hash", "created_at") VALUES ($1, $2)`,
    [hash, entry.when],
  );
}

console.info(`Backfilled ${journal.entries.length} migration tracking rows.`);
await client.end();
