import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../../../src/infrastructure/database/db";
import { activities } from "../../../src/modules/social/social.entity";
import { user } from "../../../src/infrastructure/database/auth.entity";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestFilm } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { readFollowingFeed, titleGroups, type FeedRowJson, type TitleGroupJson } from "../../support/app/following-feed";

// Likes are recorded fire-and-forget, so give the inserts a moment to land.
const waitForActivityWrites = () => new Promise((resolve) => setTimeout(resolve, 200));

describe("GET /api/social/feed/grouped", () => {
  let testServer: RunningTestServer | null = null;

  const getServer = (): RunningTestServer => {
    if (!testServer) throw new Error("Test server is not running");
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

  const send = async (jar: CookieJar, path: string, method: string, body: unknown) => {
    const response = await apiRequest(
      getServer().baseUrl,
      path,
      { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
      jar,
    );
    expect(response.ok).toBe(true);
  };

  const getRows = async (jar: CookieJar, query: string): Promise<FeedRowJson[]> =>
    (await readFollowingFeed(getServer().baseUrl, jar, query)).rows;

  const userIdOf = async (username: string): Promise<string> => {
    const [row] = await db.select({ id: user.id }).from(user).where(eq(user.username, username));
    return row!.id;
  };

  // Moves each of the user's activities about a film to the time given for it.
  const setTimesByFilm = async (userId: string, times: Map<number, string>) => {
    const rows = await db.select().from(activities).where(eq(activities.userId, userId));
    for (const row of rows) {
      const movieId = (JSON.parse(row.metadata ?? "{}") as { movieId?: number }).movieId;
      const at = movieId === undefined ? undefined : times.get(movieId);
      if (at) await db.update(activities).set({ createdAt: new Date(at) }).where(eq(activities.id, row.id));
    }
  };

  const shape = (rows: FeedRowJson[]) => rows.map((row) => `${row.day} ${row.kind}`);

  it("merges a log, rating, like and review of one title on one day into one entry", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "grpone");
    const movie = await seedTestFilm("Grouped Movie");

    await send(jar, "/api/diary", "POST", { tmdbId: movie.tmdbId, watchedDate: "2026-02-01", rating: 8 });
    await send(jar, `/api/interactions/${movie.tmdbId}`, "PUT", { liked: true });
    await send(jar, "/api/reviews", "POST", { tmdbId: movie.tmdbId, content: "Grouped review text" });
    await waitForActivityWrites();

    const rows = (await getRows(jar, "limit=20")).filter(
      (row) => row.kind === "title" && row.group.movie.tmdbId === movie.tmdbId,
    );

    expect(rows).toHaveLength(1);
    const { group } = rows[0] as Extract<FeedRowJson, { kind: "title" }>;
    expect(group).toMatchObject({ watched: true, rating: 8, liked: true });
    expect(group.review?.content).toBe("Grouped review text");
    // The day it was watched, not the day it was logged.
    expect(group.log).toMatchObject({ watchedDate: "2026-02-01", rating: 8, rewatch: false });
  });

  it("keeps only films or only TV when asked", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "grpfilter");
    const movie = await seedTestFilm("Filtered Movie");
    await send(jar, "/api/diary", "POST", { tmdbId: movie.tmdbId, watchedDate: "2026-02-02", rating: 7 });

    const hasMovie = (rows: FeedRowJson[]) => titleGroups(rows).some((group) => group.movie.tmdbId === movie.tmdbId);
    expect(hasMovie(await getRows(jar, "limit=20&mediaType=movie"))).toBe(true);
    expect(hasMovie(await getRows(jar, "limit=20&mediaType=tv"))).toBe(false);
  });

  it("pages across a day boundary without splitting or repeating a group", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "grppage");
    const [userRow] = await db.select({ id: user.id }).from(user).where(eq(user.username, username));
    const [oldest, middle, newest] = await Promise.all([
      seedTestFilm("Grouped Oldest"),
      seedTestFilm("Grouped Middle"),
      seedTestFilm("Grouped Newest"),
    ]);

    for (const movie of [oldest, middle, newest]) {
      await send(jar, `/api/interactions/${movie.tmdbId}`, "PUT", { liked: true });
      await send(jar, `/api/interactions/${movie.tmdbId}`, "PUT", { watchlisted: true });
    }
    await send(jar, "/api/diary", "POST", { tmdbId: middle.tmdbId, watchedDate: "2026-01-02" });
    await waitForActivityWrites();

    // One day per title: oldest on Jan 1, middle (3 rows) on Jan 2, newest on Jan 3.
    const dayByMovieId = new Map([
      [oldest.id, "2026-01-01"],
      [middle.id, "2026-01-02"],
      [newest.id, "2026-01-03"],
    ]);
    const rows = await db.select().from(activities).where(eq(activities.userId, userRow!.id));
    const minuteByDay = new Map<string, number>();
    for (const row of rows) {
      const movieId = (JSON.parse(row.metadata ?? "{}") as { movieId?: number }).movieId;
      const day = movieId === undefined ? undefined : dayByMovieId.get(movieId);
      if (!day) continue;
      const minute = (minuteByDay.get(day) ?? 0) + 1;
      minuteByDay.set(day, minute);
      await db
        .update(activities)
        .set({ createdAt: new Date(`${day}T10:0${minute}:00Z`) })
        .where(eq(activities.id, row.id));
    }

    // limit=2 scans 4 rows: newest's 2 rows, then middle's day straddles the page.
    const seen: TitleGroupJson[] = [];
    let cursor: string | null = null;
    for (let pageIndex = 0; pageIndex < 6; pageIndex += 1) {
      const query = `limit=2${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
      const page = await readFollowingFeed(getServer().baseUrl, jar, query);
      seen.push(...titleGroups(page.rows));
      cursor = page.nextCursor;
      if (!cursor) break;
    }

    expect(seen.map((entry) => entry.movie.tmdbId)).toEqual([
      newest.tmdbId,
      middle.tmdbId,
      oldest.tmdbId,
    ]);
    expect(seen[1]).toMatchObject({ watched: true, liked: true, watchlisted: true });
    expect(seen[1]!.itemIds).toHaveLength(3);
  });

  for (const action of ["liked", "watchlisted"] as const) {
    it(`counts a run of ${action} titles as one row, so the first page still reaches older days`, async () => {
      const { jar, username } = await signUpTestUser(getServer().baseUrl, `grpburst${action.slice(0, 4)}`);
      const [userRow] = await db.select({ id: user.id }).from(user).where(eq(user.username, username));
      const logged = await seedTestFilm(`Logged Before The ${action} Burst`);
      await send(jar, "/api/diary", "POST", { tmdbId: logged.tmdbId, watchedDate: "2026-01-01" });
      await waitForActivityWrites();
      // The log happened a day before the burst.
      await db
        .update(activities)
        .set({ createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) })
        .where(eq(activities.userId, userRow!.id));

      for (let index = 0; index < 25; index += 1) {
        const title = await seedTestFilm(`Burst ${action} ${index}`);
        await send(jar, `/api/interactions/${title.tmdbId}`, "PUT", { [action]: true });
      }
      await waitForActivityWrites();

      const rows = await getRows(jar, "limit=2");
      expect(rows).toMatchObject([
        { kind: "titles", action },
        { kind: "title", group: { movie: { tmdbId: logged.tmdbId }, watched: true } },
      ]);
      expect(rows[0]!.kind === "titles" && rows[0]!.titles).toHaveLength(25);
    });
  }

  describe("days in the viewer's time zone", () => {
    // Two likes by one person, at the given UTC times.
    const likeTwoAt = async (prefix: string, first: string, second: string) => {
      const { jar, username } = await signUpTestUser(getServer().baseUrl, prefix);
      const films = await Promise.all([seedTestFilm(`${prefix} one`), seedTestFilm(`${prefix} two`)]);
      for (const film of films) await send(jar, `/api/interactions/${film.tmdbId}`, "PUT", { liked: true });
      await waitForActivityWrites();
      await setTimesByFilm(await userIdOf(username), new Map([[films[0].id, first], [films[1].id, second]]));
      return jar;
    };

    it("folds a run that straddles UTC midnight but is one day in Istanbul", async () => {
      // 01:30 and 03:30 on Mar 3 in Istanbul (UTC+3).
      const jar = await likeTwoAt("grptzone", "2026-03-02T22:30:00Z", "2026-03-03T00:30:00Z");

      expect(shape(await getRows(jar, "tz=Europe/Istanbul"))).toEqual(["2026-03-03 titles"]);
      expect(shape(await getRows(jar, ""))).toEqual(["2026-03-03 title", "2026-03-02 title"]);
    });

    it("splits a run that is one UTC day but straddles midnight in Istanbul", async () => {
      // 23:30 on Mar 2 and 00:30 on Mar 3 in Istanbul.
      const jar = await likeTwoAt("grptztwo", "2026-03-02T20:30:00Z", "2026-03-02T21:30:00Z");

      expect(shape(await getRows(jar, "tz=Europe/Istanbul"))).toEqual(["2026-03-03 title", "2026-03-02 title"]);
      expect(shape(await getRows(jar, "tz=Not/AZone"))).toEqual(["2026-03-02 titles"]);
    });
  });
});
