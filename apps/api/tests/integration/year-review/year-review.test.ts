import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser, type SignedUpTestUser } from "../../support/app/auth-flow";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { WATCH_LOG_MEDIA, watchLogClient } from "../../support/factories/watch-log.factory";
import { db } from "../../../src/infrastructure/database/db";
import { user } from "../../../src/infrastructure/database/auth.entity";
import { films as filmTable } from "../../../src/modules/films/films.entity";
import { tvSeries, seriesEpisodeInteractions } from "../../../src/modules/tv/tv.entity";
import { profiles } from "../../../src/modules/users/users.entity";
import { follows } from "../../../src/modules/social/social.entity";
import { reviewLikes, reviews } from "../../../src/modules/reviews/reviews.entity";
import { lists } from "../../../src/modules/lists/lists.entity";
import type { YearReview } from "../../../src/modules/year-review/types/year-review.types";

const [FILM, SERIES] = WATCH_LOG_MEDIA as [(typeof WATCH_LOG_MEDIA)[0], (typeof WATCH_LOG_MEDIA)[0]];
const THIS_YEAR = new Date().getUTCFullYear();

describe("Year in Review (GET /api/users/:username/year/:year)", () => {
  let testServer: RunningTestServer | null = null;
  const baseUrl = () => {
    if (!testServer) throw new Error("Test server is not running");
    return testServer.baseUrl;
  };
  const films = watchLogClient(baseUrl, FILM);
  const series = watchLogClient(baseUrl, SERIES);

  beforeAll(async () => {
    testServer = await startTestServer();
  });

  afterAll(async () => {
    await testServer?.close();
    testServer = null;
  });

  const readRecap = async (username: string, year: number | string) => {
    const response = await apiRequest(baseUrl(), `/api/users/${username}/year/${year}`);
    return { response, body: (await response.json().catch(() => null)) as YearReview };
  };

  const userIdOf = async (username: string) => {
    const [row] = await db.select({ id: user.id }).from(user).where(eq(user.username, username));
    if (!row) throw new Error(`No user ${username}`);
    return row.id;
  };

  type FilmMeta = { runtime?: number; genres?: string[]; director?: string; releaseYear?: number; posterPath?: string };
  const seedFilm = async (title: string, meta: FilmMeta = {}) => {
    const film = await FILM.seed(title);
    await db
      .update(filmTable)
      .set({
        runtime: meta.runtime ?? null,
        genres: meta.genres?.map((name, id) => ({ id, name })) ?? null,
        director: meta.director ?? null,
        releaseYear: meta.releaseYear ?? null,
        posterPath: meta.posterPath ?? null,
      })
      .where(eq(filmTable.id, film.id));
    return film;
  };

  const signUp = (prefix: string): Promise<SignedUpTestUser> => signUpTestUser(baseUrl(), prefix);

  it("counts Films, Series and hours inside the year's UTC calendar dates and compares with last year", async () => {
    const { jar, username } = await signUp("yrtot");
    const [a, b, early, late, last] = await Promise.all([
      seedFilm("Yr A", { runtime: 120 }),
      seedFilm("Yr B", { runtime: 90 }),
      seedFilm("Yr Early", { runtime: 100 }),
      seedFilm("Yr Late", { runtime: 100 }),
      seedFilm("Yr Last", { runtime: 80 }),
    ]);
    const show = await SERIES.seed("Yr Show");
    await db.update(tvSeries).set({ episodeRuntime: 30 }).where(eq(tvSeries.id, show.id));

    await films.logId(jar, early.tmdbId, "2024-12-31");
    await films.logId(jar, a.tmdbId, "2025-01-01");
    await films.logId(jar, b.tmdbId, "2025-06-15");
    await films.logId(jar, late.tmdbId, "2025-12-31");
    await films.logId(jar, last.tmdbId, "2026-01-01");
    await series.logId(jar, show.tmdbId, "2025-03-03");

    // Episodes count toward hours in the year they were ticked (UTC); implicit ticks and other years don't.
    const userId = await userIdOf(username);
    const episode = (episodeNumber: number, updatedAt: Date, watchedImplicitly = false) => ({
      userId, seriesId: show.id, seasonNumber: 1, episodeNumber, watched: true, watchedImplicitly, updatedAt,
    });
    await db.insert(seriesEpisodeInteractions).values([
      episode(1, new Date("2025-01-01T00:00:00Z")),
      episode(2, new Date("2025-12-31T23:59:59Z")),
      episode(3, new Date("2025-05-05T12:00:00Z"), true),
      episode(4, new Date("2024-12-31T23:59:59Z")),
    ]);

    const { response, body } = await readRecap(username, 2025);
    expect(response.status).toBe(200);
    expect(body).toMatchObject({ year: 2025, isPartialYear: false, depth: "thin" });
    expect(body.user).toEqual({ username, displayName: username, avatarUrl: null });
    expect(body.totals).toMatchObject({
      films: 3,
      series: 1,
      filmLogs: 3,
      seriesLogs: 1,
      logs: 4,
      filmMinutes: 310,
      episodes: 2,
      episodeMinutes: 60,
      filmHours: 5,
      seriesHours: 1,
      hoursWatched: 6,
    });
    expect(body.previousYear).toEqual({ films: 1, series: 0, hoursWatched: 2 });
    expect(body.firstWatch).toMatchObject({ title: "Yr A", watchedDate: "2025-01-01", mediaType: "movie" });
    expect(body.lastWatch).toMatchObject({ title: "Yr Late", watchedDate: "2025-12-31" });
    expect(body.months).toHaveLength(12);
    expect(body.months[0]).toEqual({ month: 1, count: 1 });
    expect(body.months[11]).toEqual({ month: 12, count: 1 });
    expect(body.availableYears).toEqual([2026, 2025, 2024].filter((year) => year <= THIS_YEAR));
  });

  it("counts a rewatched title once, its logs each time, and names the most rewatched", async () => {
    const { jar, username } = await signUp("yrre");
    const [loop, once] = await Promise.all([seedFilm("Loop Film", { runtime: 100 }), seedFilm("Once Film")]);
    await films.logId(jar, loop.tmdbId, "2025-02-01", 6);
    await films.log(jar, loop.tmdbId, { watchedDate: "2025-04-01", rating: 8, rewatch: true });
    await films.log(jar, loop.tmdbId, { watchedDate: "2025-09-01", rewatch: true });
    await films.logId(jar, once.tmdbId, "2025-03-01", 7);

    const { body } = await readRecap(username, 2025);
    expect(body.totals).toMatchObject({ films: 2, filmLogs: 4, rewatchLogs: 2, filmMinutes: 300 });
    expect(body.mostRewatched).toMatchObject({ title: "Loop Film", logCount: 3 });
    expect(body.topRated.map((title) => [title.title, title.rating])).toEqual([["Loop Film", 8], ["Once Film", 7]]);
    expect(body.ratings).toMatchObject({ average: 7, ratedLogs: 3 });
  });

  it("leaves deleted logs out of every number", async () => {
    const { jar, username } = await signUp("yrdel");
    const [kept, gone] = await Promise.all([seedFilm("Kept Film"), seedFilm("Gone Film", { runtime: 200 })]);
    await films.logId(jar, kept.tmdbId, "2025-05-01");
    const goneId = await films.logId(jar, gone.tmdbId, "2025-05-02", 9);
    await films.send(jar, "DELETE", FILM.logPath(goneId));

    const { body } = await readRecap(username, 2025);
    expect(body.totals).toMatchObject({ films: 1, filmLogs: 1, filmMinutes: 0 });
    expect(body.topRated).toEqual([]);
    expect(body.longestStreak).toEqual({ days: 1, start: "2025-05-01", end: "2025-05-01" });
    expect(body.lastWatch?.title).toBe("Kept Film");
  });

  it("finds the longest run of consecutive days with a Diary Entry, across month ends and media types", async () => {
    const { jar, username } = await signUp("yrstk");
    const film = await seedFilm("Streak Film");
    const show = await SERIES.seed("Streak Show");
    for (const day of ["2025-03-10", "2025-03-11", "2025-06-01"]) await films.logId(jar, film.tmdbId, day);
    for (const day of ["2025-01-30", "2025-01-31"]) await films.logId(jar, film.tmdbId, day);
    // Two logs on one day still count as one day of the streak.
    for (const day of ["2025-02-01", "2025-02-01", "2025-02-02"]) await series.logId(jar, show.tmdbId, day);

    const { body } = await readRecap(username, 2025);
    expect(body.longestStreak).toEqual({ days: 4, start: "2025-01-30", end: "2025-02-02" });
    expect(body.busiestMonth).toEqual({ month: 2, count: 3 });
    expect(body.logsPerDay.find((day) => day.day === "2025-02-01")).toEqual({ day: "2025-02-01", count: 2 });
  });

  it("ranks genres, directors and decades by title, and compares ratings with the community", async () => {
    const { jar, username } = await signUp("yrtst");
    const other = await signUp("yroth");
    const [x, y, z] = await Promise.all([
      seedFilm("Taste X", { genres: ["Drama", "Crime"], director: "Ada Lens", releaseYear: 1994 }),
      seedFilm("Taste Y", { genres: ["Drama"], director: "Ada Lens", releaseYear: 1999 }),
      seedFilm("Taste Z", { genres: ["Comedy"], director: "Bo Frame", releaseYear: 2021 }),
    ]);
    await films.logId(jar, x.tmdbId, "2025-01-05", 9);
    await films.log(jar, x.tmdbId, { watchedDate: "2025-02-05", rating: 9, rewatch: true });
    await films.logId(jar, y.tmdbId, "2025-01-06", 7);
    await films.logId(jar, z.tmdbId, "2025-01-07");
    await films.logId(other.jar, x.tmdbId, "2025-01-05", 5);
    await films.logId(other.jar, y.tmdbId, "2025-01-05", 5);

    const { body } = await readRecap(username, 2025);
    expect(body.topGenres).toEqual([
      { genre: "Drama", count: 2 },
      { genre: "Comedy", count: 1 },
      { genre: "Crime", count: 1 },
    ]);
    expect(body.topDirectors).toEqual([
      { director: "Ada Lens", count: 2, slug: null },
      { director: "Bo Frame", count: 1, slug: null },
    ]);
    expect(body.decades).toEqual([
      { decade: 1990, count: 2 },
      { decade: 2020, count: 1 },
    ]);
    // Theirs: (9 + 9 + 7) / 3. Community per title: X (9, 5) → 7, Y (7, 5) → 6; averaged → 6.5.
    expect(body.ratings).toEqual({ average: 8.33, ratedLogs: 3, communityAverage: 6.5 });
  });

  it("counts Reviews, the most-liked one, public Lists and new followers by UTC creation time", async () => {
    const { jar, username } = await signUp("yrsoc");
    const fans = await Promise.all([signUp("yrfa"), signUp("yrfb"), signUp("yrfc")]);
    const film = await seedFilm("Social Film", { posterPath: "/social.jpg" });
    await films.logId(jar, film.tmdbId, "2025-04-01");
    const userId = await userIdOf(username);
    const fanIds = await Promise.all(fans.map((fan) => userIdOf(fan.username)));

    const createReview = async (content: string, createdAt: string, containsSpoilers = false) => {
      const response = await apiRequest(
        baseUrl(),
        "/api/reviews",
        { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tmdbId: film.tmdbId, content, containsSpoilers }) },
        jar,
      );
      expect(response.status).toBe(201);
      const id = ((await response.json()) as { review: { id: string } }).review.id;
      await db.update(reviews).set({ createdAt: new Date(createdAt) }).where(eq(reviews.id, id));
      return id;
    };
    const loved = await createReview("Loved   every\nminute of it.", "2025-03-01T10:00:00Z");
    const spoiler = await createReview("The twist is that…", "2025-12-31T23:59:59Z", true);
    const lastYear = await createReview("Older thoughts.", "2024-12-31T23:59:59Z");
    await db.insert(reviewLikes).values([
      { userId: fanIds[0]!, reviewId: loved },
      { userId: fanIds[1]!, reviewId: loved },
      { userId: fanIds[0]!, reviewId: spoiler },
      { userId: fanIds[0]!, reviewId: lastYear },
      { userId: fanIds[1]!, reviewId: lastYear },
      { userId: fanIds[2]!, reviewId: lastYear },
    ]);

    await db.insert(lists).values([
      { userId, title: "Public 2025", isPublic: true, createdAt: new Date("2025-06-01T00:00:00Z") },
      { userId, title: "Private 2025", isPublic: false, createdAt: new Date("2025-06-01T00:00:00Z") },
      { userId, title: "Public 2026", isPublic: true, createdAt: new Date("2026-01-01T00:00:00Z") },
    ]);
    await db.insert(follows).values([
      { followerId: fanIds[0]!, followingId: userId, createdAt: new Date("2025-01-01T00:00:00Z") },
      { followerId: fanIds[1]!, followingId: userId, createdAt: new Date("2025-07-07T00:00:00Z") },
      { followerId: fanIds[2]!, followingId: userId, createdAt: new Date("2024-12-31T23:59:59Z") },
    ]);

    const { body } = await readRecap(username, 2025);
    expect(body.reviews).toEqual({
      count: 2,
      mostLiked: {
        id: loved,
        mediaType: "movie",
        tmdbId: film.tmdbId,
        mediaTitle: "Social Film",
        posterPath: "/social.jpg",
        likeCount: 2,
        containsSpoilers: false,
        excerpt: "Loved every minute of it.",
      },
    });
    expect(body.listsCreated).toBe(1);
    expect(body.newFollowers).toBe(2);
  });

  it("reports the year's Watch Goal result when one was set", async () => {
    const { jar, username } = await signUp("yrgol");
    const film = await seedFilm("Goal Film");
    await films.logId(jar, film.tmdbId, "2025-08-08");
    const set = await apiRequest(
      baseUrl(),
      "/api/users/me/goal/2025",
      { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ targetFilms: 1, targetSeries: 2 }) },
      jar,
    );
    expect(set.status).toBe(200);

    const { body } = await readRecap(username, 2025);
    expect(body.goal).toEqual({ targetFilms: 1, targetSeries: 2, filmsWatched: 1, seriesWatched: 0, reached: false });
    expect((await readRecap(username, 2024)).body.goal).toBeNull();
  });

  it("returns a short, zeroed recap for a year with no Diary Entries", async () => {
    const { username } = await signUp("yremp");
    const { response, body } = await readRecap(username, 2023);
    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      depth: "empty",
      previousYear: null,
      busiestMonth: null,
      longestStreak: null,
      firstWatch: null,
      lastWatch: null,
      mostRewatched: null,
      goal: null,
      topRated: [],
      topGenres: [],
      logsPerDay: [],
      posterPaths: [],
      availableYears: [],
      ratings: { average: null, ratedLogs: 0, communityAverage: null },
      reviews: { count: 0, mostLiked: null },
    });
    expect(body.totals.logs).toBe(0);
  });

  it("marks the current year as so far and a busy year as full", async () => {
    const { jar, username } = await signUp("yrnow");
    const film = await seedFilm("Busy Film");
    for (let day = 1; day <= 10; day += 1) {
      await films.logId(jar, film.tmdbId, `${THIS_YEAR}-01-${String(day).padStart(2, "0")}`);
    }
    const { response, body } = await readRecap(username, THIS_YEAR);
    expect(body).toMatchObject({ isPartialYear: true, depth: "full" });
    expect(body.longestStreak?.days).toBe(10);
    expect(response.headers.get("cache-control")).toBe("public, max-age=300, s-maxage=600");
  });

  it("sends long public cache headers for a past year and short ones for a 404", async () => {
    const { username } = await signUp("yrhdr");
    const past = await readRecap(username, 2024);
    expect(past.response.headers.get("cache-control")).toBe("public, max-age=3600, s-maxage=21600");

    const missing = await readRecap("no-such-recap-user", 2024);
    expect(missing.response.status).toBe(404);
    expect(missing.response.headers.get("cache-control")).toBe("public, max-age=60");
  });

  it("validates the year: 2000 through the current year", async () => {
    const { username } = await signUp("yrval");
    expect((await readRecap(username, 1999)).response.status).toBe(400);
    expect((await readRecap(username, THIS_YEAR + 1)).response.status).toBe(400);
    expect((await readRecap(username, "twenty")).response.status).toBe(400);
    expect((await readRecap(username, 2000)).response.status).toBe(200);
  });

  it("404s while a Suspension is in effect, and not once it has ended", async () => {
    const [suspended, ended] = await Promise.all([signUp("yrsus"), signUp("yrend")]);
    const [suspendedId, endedId] = await Promise.all([userIdOf(suspended.username), userIdOf(ended.username)]);
    await Promise.all([
      db.update(profiles).set({ isSuspended: true }).where(eq(profiles.userId, suspendedId)),
      db
        .update(profiles)
        .set({ isSuspended: true, suspendedUntil: new Date(Date.now() - 60_000) })
        .where(eq(profiles.userId, endedId)),
    ]);

    expect((await readRecap(suspended.username, 2025)).response.status).toBe(404);
    expect((await readRecap(ended.username, 2025)).response.status).toBe(200);
  });
});
