import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestMovie } from "../../support/factories/media.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import { user } from "../../../src/infrastructure/database/auth.entity";
import { diaryEntries } from "../../../src/modules/diary/diary.entity";
import { movieInteractions } from "../../../src/modules/interactions/interactions.entity";
import { MoviesRepository } from "../../../src/modules/movies/repositories/movies.repository";

const getUserIdByUsername = async (username: string): Promise<string> => {
  const [row] = await db.select({ id: user.id }).from(user).where(eq(user.username, username));
  if (!row) {
    throw new Error(`Test user ${username} not found`);
  }
  return row.id;
};

// Regression coverage for the "diary rating wins, dedupe by user" rule that
// buildCommunityRatingAggregateSql now implements once for both archive
// queries below (previously hand-duplicated as raw correlated-subquery SQL
// in each). Locks in the exact bug class commit 6a2fa88 fixed: a user's
// stale interaction-widget rating must never be double-counted alongside
// their diary rating for the same item.
describe("movies community rating aggregate", () => {
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
    const movie = await seedTestMovie();
    const dualRater = await signUpTestUser(testServer!.baseUrl, "dualrater");
    const interactionOnlyRater = await signUpTestUser(testServer!.baseUrl, "intonly");

    const dualUserId = await getUserIdByUsername(dualRater.username);
    const interactionOnlyUserId = await getUserIdByUsername(interactionOnlyRater.username);

    // dualRater: logged a diary rating of 9, but also has a stale
    // interaction-widget rating of 3 for the same movie (e.g. rated via the
    // star widget before logging, or vice versa).
    await db.insert(diaryEntries).values({
      userId: dualUserId,
      movieId: movie.id,
      watchedDate: "2026-01-01",
      rating: 9,
    });
    await db.insert(movieInteractions).values({
      userId: dualUserId,
      movieId: movie.id,
      rating: 3,
    });

    // interactionOnlyRater: rated via the star widget only, never logged a
    // diary entry for this movie.
    await db.insert(movieInteractions).values({
      userId: interactionOnlyUserId,
      movieId: movie.id,
      rating: 7,
    });

    const [aggregateRow] = await MoviesRepository.getLocalArchiveAggregateRowsByTmdbIds([
      movie.tmdbId,
    ]);

    expect(aggregateRow).toBeDefined();
    expect(aggregateRow!.ratedLogCount).toBe(2);
    expect(aggregateRow!.avgRatingOutOfTen).toBeCloseTo((9 + 7) / 2, 5);

    const [listingRow] = (await MoviesRepository.getLocalArchiveRows()).filter(
      (row) => row.tmdbId === movie.tmdbId,
    );
    expect(listingRow).toBeDefined();
    expect(listingRow!.ratedLogCount).toBe(2);
    expect(listingRow!.avgRatingOutOfTen).toBeCloseTo((9 + 7) / 2, 5);
  });
});
