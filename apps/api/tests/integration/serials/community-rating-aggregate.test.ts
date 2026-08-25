import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestSerial } from "../../support/factories/media.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import { user } from "../../../src/infrastructure/database/auth.entity";
import { serialDiaryEntries, serialInteractions } from "../../../src/modules/serials/serials.entity";
import { SerialsArchiveRepository } from "../../../src/modules/serials/repositories/serials-archive.repository";

const getUserIdByUsername = async (username: string): Promise<string> => {
  const [row] = await db.select({ id: user.id }).from(user).where(eq(user.username, username));
  if (!row) {
    throw new Error(`Test user ${username} not found`);
  }
  return row.id;
};

// Same rule as tests/integration/movies/community-rating-aggregate.test.ts,
// exercised against the serials side of buildCommunityRatingAggregateSql -
// both repositories now share one implementation, so this locks in that the
// shared builder behaves identically for the "series_id"-keyed tables too.
describe("serials community rating aggregate", () => {
  let testServer: RunningTestServer | null = null;

  beforeAll(async () => {
    testServer = await startTestServer();
  });

  afterAll(async () => {
    if (!testServer) return;
    await testServer.close();
    testServer = null;
  });

  it("counts a user's diary rating once even when they also have a differing interaction rating, and counts interaction-only raters separately", async () => {
    const serial = await seedTestSerial();
    const dualRater = await signUpTestUser(testServer!.baseUrl, "serdualrate");
    const interactionOnlyRater = await signUpTestUser(testServer!.baseUrl, "serintonly");

    const dualUserId = await getUserIdByUsername(dualRater.username);
    const interactionOnlyUserId = await getUserIdByUsername(interactionOnlyRater.username);

    await db.insert(serialDiaryEntries).values({
      userId: dualUserId,
      seriesId: serial.id,
      watchedDate: "2026-01-01",
      rating: 9,
    });
    await db.insert(serialInteractions).values({
      userId: dualUserId,
      seriesId: serial.id,
      rating: 3,
    });

    await db.insert(serialInteractions).values({
      userId: interactionOnlyUserId,
      seriesId: serial.id,
      rating: 7,
    });

    const [aggregateRow] = await SerialsArchiveRepository.getLocalArchiveAggregateRowsByTmdbIds([
      serial.tmdbId,
    ]);

    expect(aggregateRow).toBeDefined();
    expect(aggregateRow!.ratedLogCount).toBe(2);
    expect(aggregateRow!.avgRatingOutOfTen).toBeCloseTo((9 + 7) / 2, 5);

    const [listingRow] = (await SerialsArchiveRepository.getLocalArchiveRows()).filter(
      (row) => row.tmdbId === serial.tmdbId,
    );
    expect(listingRow).toBeDefined();
    expect(listingRow!.ratedLogCount).toBe(2);
    expect(listingRow!.avgRatingOutOfTen).toBeCloseTo((9 + 7) / 2, 5);
  });
});
