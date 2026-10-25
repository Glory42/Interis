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

// Each user counts once, with what their own "Your rating" shows: the star
// rating, else their latest rated log. The detail page (merged in JS) and
// both archive queries (SQL) must agree (#92).
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

  const signUp = async (prefix: string) =>
    getUserIdByUsername((await signUpTestUser(testServer!.baseUrl, prefix)).username);

  it("counts each user once, star rating first, and agrees across detail and archive", async () => {
    const movie = await seedTestMovie();
    const [starAndLogs, logsOnly, unratedLogAndStar] = await Promise.all([
      signUp("crastar"),
      signUp("cralogs"),
      signUp("craunrated"),
    ]);

    await db.insert(diaryEntries).values([
      // Two rated logs and a star rating: the star rating counts.
      { userId: starAndLogs, movieId: movie.id, watchedDate: "2026-01-01", rating: 9 },
      { userId: starAndLogs, movieId: movie.id, watchedDate: "2026-03-01", rating: 5 },
      // Two rated logs, no star rating: the latest watch counts.
      { userId: logsOnly, movieId: movie.id, watchedDate: "2026-03-01", rating: 8 },
      { userId: logsOnly, movieId: movie.id, watchedDate: "2026-01-01", rating: 6 },
      // A log without a rating doesn't hide the star rating.
      { userId: unratedLogAndStar, movieId: movie.id, watchedDate: "2026-01-01", rating: null },
    ]);
    await db.insert(movieInteractions).values([
      { userId: starAndLogs, movieId: movie.id, rating: 3 },
      { userId: logsOnly, movieId: movie.id, liked: true },
      { userId: unratedLogAndStar, movieId: movie.id, rating: 7 },
    ]);

    const expectedRatings = [3, 7, 8];
    const detailRatings = await MoviesRepository.getCommunityRatingsByMovieId(movie.id);
    expect(detailRatings.map((row) => row.rating).sort()).toEqual(expectedRatings);

    const [aggregateRow] = await MoviesRepository.getLocalArchiveAggregateRowsByTmdbIds([
      movie.tmdbId,
    ]);
    const [listingRow] = (await MoviesRepository.getLocalArchiveRows()).filter(
      (row) => row.tmdbId === movie.tmdbId,
    );
    for (const row of [aggregateRow, listingRow]) {
      expect(row!.ratedLogCount).toBe(3);
      expect(row!.avgRatingOutOfTen).toBeCloseTo((3 + 7 + 8) / 3, 5);
    }
  });
});
