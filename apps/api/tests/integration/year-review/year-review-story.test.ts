import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser, type SignedUpTestUser } from "../../support/app/auth-flow";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { WATCH_LOG_MEDIA, watchLogClient } from "../../support/factories/watch-log.factory";
import { db } from "../../../src/infrastructure/database/db";
import { films as filmTable } from "../../../src/modules/films/films.entity";
import { reviews } from "../../../src/modules/reviews/reviews.entity";
import type { YearReview } from "../../../src/modules/year-review/types/year-review.types";

const [FILM] = WATCH_LOG_MEDIA as [(typeof WATCH_LOG_MEDIA)[0]];

describe("Year in Review story data", () => {
  let testServer: RunningTestServer | null = null;
  const baseUrl = () => {
    if (!testServer) throw new Error("Test server is not running");
    return testServer.baseUrl;
  };
  const films = watchLogClient(baseUrl, FILM);

  beforeAll(async () => {
    testServer = await startTestServer();
  });

  afterAll(async () => {
    await testServer?.close();
    testServer = null;
  });

  const readRecap = async (username: string, year: number) => {
    const response = await apiRequest(baseUrl(), `/api/users/${username}/year/${year}`);
    return { response, body: (await response.json()) as YearReview };
  };

  const signUp = (prefix: string): Promise<SignedUpTestUser> => signUpTestUser(baseUrl(), prefix);

  type FilmMeta = { genres?: string[]; director?: string; releaseYear?: number; posterPath?: string };
  const seedFilm = async (title: string, meta: FilmMeta = {}) => {
    const film = await FILM.seed(title);
    await db
      .update(filmTable)
      .set({
        genres: meta.genres?.map((name, id) => ({ id, name })) ?? null,
        director: meta.director ?? null,
        releaseYear: meta.releaseYear ?? null,
        posterPath: meta.posterPath ?? null,
      })
      .where(eq(filmTable.id, film.id));
    return film;
  };

  it("builds ranked titles, viewing age, pre-1980 share, director titles and the persona", async () => {
    const { jar, username } = await signUp("yrsto");
    const years = [1970, 1972, 1974, 1976, 1978, 2020];
    const seeded = await Promise.all(
      years.map((releaseYear, index) =>
        seedFilm(`Story ${releaseYear}`, {
          genres: ["Drama"],
          director: index === years.length - 1 ? "Bo Frame" : "Ada Lens",
          releaseYear,
          posterPath: `/story-${releaseYear}.jpg`,
        }),
      ),
    );

    for (let index = 0; index < seeded.length; index += 1) {
      await films.logId(jar, seeded[index]!.tmdbId, `2025-01-0${index + 1}`, index === 0 ? 9 : 8);
    }
    // A second log on the same day makes the busiest day deterministic.
    await films.log(jar, seeded[0]!.tmdbId, { watchedDate: "2025-01-01", rating: 9, rewatch: true });

    const reviewResponse = await apiRequest(
      baseUrl(),
      "/api/reviews",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tmdbId: seeded[0]!.tmdbId,
          content: "A film that stayed with me.",
          containsSpoilers: false,
        }),
      },
      jar,
    );
    expect(reviewResponse.status).toBe(201);
    const reviewId = ((await reviewResponse.json()) as { review: { id: string } }).review.id;
    await db.update(reviews).set({ createdAt: new Date("2025-12-01T00:00:00Z") }).where(eq(reviews.id, reviewId));

    const { body } = await readRecap(username, 2025);
    expect(body.topFilms.map((title) => title.title)).toEqual([
      "Story 1970",
      "Story 2020",
      "Story 1978",
      "Story 1976",
      "Story 1974",
    ]);
    expect(body.topFilm?.title).toBe("Story 1970");
    expect(body.topFilm?.review).toEqual({
      id: reviewId,
      excerpt: "A film that stayed with me.",
      containsSpoilers: false,
    });
    expect(body.topSeries).toEqual([]);
    expect(body.busiestDay).toEqual({ day: "2025-01-01", count: 2 });
    expect(body.viewingAge).toBe(1975);
    expect(body.pre1980Share).toBe(0.833);
    expect(body.highRatings).toBe(1);
    expect(body.distinctGenres).toBe(1);
    expect(body.distinctDirectors).toBe(2);
    expect(body.directorTitles.map((title) => title.title)).toEqual(["Story 1978", "Story 1976", "Story 1974"]);
    expect(body.posterPaths).toHaveLength(6);
    expect(body.persona?.id).toBe("time-traveller");
    expect(body.persona?.traits).toEqual(["1970s", "Drama", "Rewatcher", "8.3 avg"]);
  });
});
