import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../src/infrastructure/database/db";
import { credentials, user } from "../src/infrastructure/database/auth.entity";

// Cutover step for issue #29: every existing user gets an explicit,
// unusable `credentials` row (passwordHash: null) so their next login
// attempt fails cleanly and routes them into "forgot password" — never
// carries the old Better Auth hash forward. Safe to re-run: skips users
// that already have a password credential row.
const run = async () => {
  const users = await db.select({ id: user.id }).from(user);
  const existing = await db
    .select({ userId: credentials.userId })
    .from(credentials)
    .where(eq(credentials.type, "password"));

  const alreadyBackfilled = new Set(existing.map((row) => row.userId));
  const pending = users.filter((row) => !alreadyBackfilled.has(row.id));

  if (pending.length === 0) {
    console.info("No users need a credentials backfill.");
    return;
  }

  await db.insert(credentials).values(
    pending.map((row) => ({
      id: randomUUID(),
      userId: row.id,
      type: "password" as const,
      passwordHash: null,
    })),
  );

  console.info(`Backfilled credentials rows for ${pending.length} user(s).`);
};

await run();
