import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { randomInt } from "node:crypto";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import { movies } from "../../../src/modules/movies/movies.entity";
import { tvSeries } from "../../../src/modules/serials/serials.entity";
import { eq } from "drizzle-orm";
import { seedTestSerial } from "../../support/factories/media.factory";

const isoWeekOf = (date: Date): number => {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  day.setUTCDate(day.getUTCDate() + 4 - (day.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(day.getUTCFullYear(), 0, 1));
  return Math.ceil(((day.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
};

const seedMovieWithMetadata = async (
  title: string,
  director: string,
  genreNames: string[],
): Promise<{ id: number; tmdbId: number }> => {
  const tmdbId = randomInt(1_000_000, 999_000_000);
  const [row] = await db
    .insert(movies)
    .values({
      tmdbId,
      title,
      director,
      genres: genreNames.map((name, index) => ({ id: index, name })),
    })
    .returning({ id: movies.id, tmdbId: movies.tmdbId });

  if (!row) {
    throw new Error("Failed to seed movie with metadata");
  }

  return row;
};

describe("detailed stats", () => {
  let testServer: RunningTestServer | null = null;

  const getServer = (): RunningTestServer => {
    if (!testServer) {
      throw new Error("Test server is not running");
    }
    return testServer;
  };

  beforeAll(async () => {
    testServer = await startTestServer();
  });

  afterAll(async () => {
    if (!testServer) return;
    await testServer.close();
    testServer = null;
  });

  it("404s for a nonexistent user", async () => {
    const response = await apiRequest(
      getServer().baseUrl,
      "/api/users/does-not-exist/stats/detailed",
    );
    expect(response.status).toBe(404);
  });

  it("aggregates months, ratings, genres, and directors from diary entries", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "stat");
    const movieA = await seedMovieWithMetadata("Movie A", "Jane Director", ["Drama", "Action"]);
    const movieB = await seedMovieWithMetadata("Movie B", "Jane Director", ["Drama"]);

    const logMovie = (tmdbId: number, watchedDate: string, rating: number) =>
      apiRequest(
        getServer().baseUrl,
        "/api/diary",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ tmdbId, watchedDate, rating }),
        },
        jar,
      );

    await logMovie(movieA.tmdbId, "2026-06-01", 8);
    await logMovie(movieB.tmdbId, "2026-06-15", 8);
    await logMovie(movieA.tmdbId, "2026-05-01", 6);

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/users/${username}/stats/detailed`,
    );
    expect(response.status).toBe(200);

    const stats = (await response.json()) as {
      entriesPerMonth: { month: string; count: number }[];
      ratingDistribution: { rating: number; count: number }[];
      topGenres: { genre: string; count: number }[];
      topDirectors: { director: string; count: number }[];
    };

    expect(stats.entriesPerMonth.find((m) => m.month === "2026-06")?.count).toBe(2);
    expect(stats.entriesPerMonth.find((m) => m.month === "2026-05")?.count).toBe(1);

    expect(stats.ratingDistribution.find((r) => r.rating === 8)?.count).toBe(2);
    expect(stats.ratingDistribution.find((r) => r.rating === 6)?.count).toBe(1);

    expect(stats.topGenres.find((g) => g.genre === "Drama")?.count).toBe(3);
    expect(stats.topGenres.find((g) => g.genre === "Action")?.count).toBe(2);

    expect(stats.topDirectors.find((d) => d.director === "Jane Director")?.count).toBe(3);
  });

  it("adds average rating, rated logs, hours watched and this year's logs per week", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "statx");
    const longFilm = await seedMovieWithMetadata("Long Film", "A", ["Drama"]);
    const shortFilm = await seedMovieWithMetadata("Short Film", "B", ["Drama"]);
    await db.update(movies).set({ runtime: 120 }).where(eq(movies.id, longFilm.id));
    await db.update(movies).set({ runtime: 90 }).where(eq(movies.id, shortFilm.id));
    const serial = await seedTestSerial("Stats Serial");
    await db.update(tvSeries).set({ episodeRuntime: 45 }).where(eq(tvSeries.id, serial.id));

    const today = new Date().toISOString().slice(0, 10);
    const send = (path: string, method: string, body: unknown) =>
      apiRequest(
        getServer().baseUrl,
        path,
        { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
        jar,
      );
    await send("/api/diary", "POST", { tmdbId: longFilm.tmdbId, watchedDate: today, rating: 8 });
    await send("/api/diary", "POST", { tmdbId: shortFilm.tmdbId, watchedDate: today, rating: 6 });
    await send("/api/diary", "POST", { tmdbId: shortFilm.tmdbId, watchedDate: today });
    for (const episode of [1, 2]) {
      await send(`/api/serials/${serial.tmdbId}/seasons/1/episodes/${episode}/interaction`, "PUT", {
        watched: true,
      });
    }

    const response = await apiRequest(getServer().baseUrl, `/api/users/${username}/stats/detailed`);
    const stats = (await response.json()) as {
      averageRating: number | null;
      ratedLogCount: number;
      hoursWatched: number;
      logsPerWeek: { week: number; count: number }[];
    };

    expect(stats.averageRating).toBe(7);
    expect(stats.ratedLogCount).toBe(2);
    // 120 + 90 + 90 film minutes + 2 × 45 episode minutes = 390 minutes.
    expect(stats.hoursWatched).toBe(6.5);
    expect(stats.logsPerWeek).toEqual([{ week: isoWeekOf(new Date()), count: 3 }]);
  });
});
