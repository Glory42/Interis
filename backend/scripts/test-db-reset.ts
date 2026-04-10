import { sql } from "drizzle-orm";
import { db } from "../src/infrastructure/database/db";
import { assertResetAllowed } from "../tests/support/db/test-db";

const run = async () => {
  assertResetAllowed();

  await db.execute(sql`
    DO $$
    DECLARE
      table_list text;
    BEGIN
      SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
      INTO table_list
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename <> '__drizzle_migrations';

      IF table_list IS NOT NULL THEN
        EXECUTE 'TRUNCATE TABLE ' || table_list || ' RESTART IDENTITY CASCADE';
      END IF;
    END $$;
  `);

  console.info("Test database reset complete.");
};

await run();
