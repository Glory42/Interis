import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import type { CookieJar } from "../../support/app/cookie-jar";
import { WATCH_LOG_MEDIA, watchLogClient } from "../../support/factories/watch-log.factory";

type GoalProgress = {
  year: number;
  goal: { targetFilms: number; targetSeries: number | null } | null;
  films: { watched: number; target: number | null; pace: { status: string; diff: number } | null };
  series: { watched: number; target: number | null; pace: { status: string; diff: number } | null };
  reached: boolean;
  years: { year: number; targetFilms: number; targetSeries: number | null }[];
};

const [FILM, SERIES] = WATCH_LOG_MEDIA as [(typeof WATCH_LOG_MEDIA)[0], (typeof WATCH_LOG_MEDIA)[0]];
const THIS_YEAR = new Date().getUTCFullYear();

describe("watch goal", () => {
  let testServer: RunningTestServer | null = null;
  const baseUrl = () => {
    if (!testServer) throw new Error("Test server is not running");
    return testServer.baseUrl;
  };
  const films = watchLogClient(baseUrl, FILM);
  const series = watchLogClient(baseUrl, SERIES);

  const readGoal = async (username: string, query = "", jar?: CookieJar) => {
    const response = await apiRequest(baseUrl(), `/api/users/${username}/goal${query}`, {}, jar);
    return { status: response.status, body: (await response.json().catch(() => null)) as GoalProgress };
  };
  const setGoal = (jar: CookieJar | undefined, year: number | string, body: unknown) =>
    apiRequest(
      baseUrl(),
      `/api/users/me/goal/${year}`,
      { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
      jar,
    );
  const clearGoal = (jar: CookieJar | undefined, year: number) =>
    apiRequest(baseUrl(), `/api/users/me/goal/${year}`, { method: "DELETE" }, jar);

  beforeAll(async () => {
    testServer = await startTestServer();
  });

  afterAll(async () => {
    await testServer?.close();
    testServer = null;
  });

  it("counts distinct titles logged in the year: rewatches once, boundaries exclusive, deleted logs gone", async () => {
    const { jar, username } = await signUpTestUser(baseUrl(), "goal");
    const [filmA, filmB, filmC, filmD] = await Promise.all([
      FILM.seed("Goal A"),
      FILM.seed("Goal B"),
      FILM.seed("Goal C"),
      FILM.seed("Goal D"),
    ]);
    const [showA, showB] = await Promise.all([SERIES.seed("Goal Show A"), SERIES.seed("Goal Show B")]);

    await films.logId(jar, filmA.tmdbId, "2025-01-01");
    await films.log(jar, filmA.tmdbId, { watchedDate: "2025-08-10", rewatch: true });
    const lateB = await films.logId(jar, filmB.tmdbId, "2025-12-31");
    await films.logId(jar, filmC.tmdbId, "2024-12-31");
    await films.logId(jar, filmD.tmdbId, "2026-01-01");
    await series.logId(jar, showA.tmdbId, "2025-03-01");
    await series.log(jar, showA.tmdbId, { watchedDate: "2025-09-01", rewatch: true });
    await series.logId(jar, showB.tmdbId, "2024-06-01");

    const before = await readGoal(username, "?year=2025");
    expect(before.status).toBe(200);
    expect(before.body.goal).toBeNull();
    expect(before.body.films.watched).toBe(2);
    expect(before.body.series.watched).toBe(1);

    await films.send(jar, "DELETE", FILM.logPath(lateB));
    const after = await readGoal(username, "?year=2025");
    expect(after.body.films.watched).toBe(1);
  });

  it("sets, updates and clears the signed-in user's goal for a year", async () => {
    const { jar, username } = await signUpTestUser(baseUrl(), "goal");
    const film = await FILM.seed("Goal Crud");
    await films.logId(jar, film.tmdbId, "2024-05-05");

    const created = await setGoal(jar, 2024, { targetFilms: 3, targetSeries: 2 });
    expect(created.status).toBe(200);
    expect(await created.json()).toMatchObject({ year: 2024, targetFilms: 3, targetSeries: 2 });

    const updated = await setGoal(jar, 2024, { targetFilms: 1 });
    expect(updated.status).toBe(200);
    await setGoal(jar, THIS_YEAR, { targetFilms: 50 });

    const read = await readGoal(username, "?year=2024");
    expect(read.body.goal).toMatchObject({ targetFilms: 1, targetSeries: null });
    expect(read.body.films).toMatchObject({ watched: 1, target: 1, pace: { status: "reached" } });
    expect(read.body.series.pace).toBeNull();
    expect(read.body.reached).toBe(true);
    expect(read.body.years.map((row) => row.year)).toEqual([THIS_YEAR, 2024]);

    expect((await clearGoal(jar, 2024)).status).toBe(204);
    expect((await clearGoal(jar, 2024)).status).toBe(404);
    const cleared = await readGoal(username, "?year=2024");
    expect(cleared.body.goal).toBeNull();
    expect(cleared.body.years.map((row) => row.year)).toEqual([THIS_YEAR]);
  });

  it("marks a past year's unmet goal missed and defaults to the viewer's current year", async () => {
    const { jar, username } = await signUpTestUser(baseUrl(), "goal");
    await setGoal(jar, 2023, { targetFilms: 10 });

    const past = await readGoal(username, "?year=2023");
    expect(past.body.films.pace).toMatchObject({ status: "missed", diff: -10 });
    expect(past.body.reached).toBe(false);

    const current = await readGoal(username, "?tz=Pacific/Kiritimati");
    expect(current.status).toBe(200);
    expect([THIS_YEAR, THIS_YEAR + 1]).toContain(current.body.year);
  });

  it("rejects out-of-range years and targets", async () => {
    const { jar, username } = await signUpTestUser(baseUrl(), "goal");
    const invalid: [number | string, unknown][] = [
      [THIS_YEAR, { targetFilms: 0 }],
      [THIS_YEAR, { targetFilms: 2001 }],
      [THIS_YEAR, { targetFilms: 2.5 }],
      [THIS_YEAR, { targetFilms: 10, targetSeries: 0 }],
      [THIS_YEAR, {}],
      [1999, { targetFilms: 10 }],
      [THIS_YEAR + 2, { targetFilms: 10 }],
      ["soon", { targetFilms: 10 }],
    ];
    for (const [year, body] of invalid) {
      expect((await setGoal(jar, year, body)).status).toBe(400);
    }
    expect((await setGoal(jar, THIS_YEAR + 1, { targetFilms: 2000, targetSeries: 2000 })).status).toBe(200);
    expect((await readGoal(username, "?year=1800")).status).toBe(400);
  });

  it("is readable by anyone but writable only by its owner", async () => {
    const owner = await signUpTestUser(baseUrl(), "goal");
    const other = await signUpTestUser(baseUrl(), "goal");
    await setGoal(owner.jar, THIS_YEAR, { targetFilms: 12 });

    expect((await setGoal(undefined, THIS_YEAR, { targetFilms: 1 })).status).toBe(401);
    expect((await clearGoal(undefined, THIS_YEAR)).status).toBe(401);
    // Another user's write lands on their own goal, never the owner's.
    await setGoal(other.jar, THIS_YEAR, { targetFilms: 1 });

    const anonymous = await readGoal(owner.username, `?year=${THIS_YEAR}`);
    expect(anonymous.status).toBe(200);
    expect(anonymous.body.goal?.targetFilms).toBe(12);
    const asOther = await readGoal(owner.username, `?year=${THIS_YEAR}`, other.jar);
    expect(asOther.body.goal?.targetFilms).toBe(12);
    expect((await readGoal("no-such-user-goal")).status).toBe(404);
  });

  it("puts the current year's goal on the feed summary once set", async () => {
    const { jar } = await signUpTestUser(baseUrl(), "goal");
    const summary = async () =>
      (await (await apiRequest(baseUrl(), "/api/users/me/summary?tz=UTC", {}, jar)).json()) as {
        goal: { year: number; targetFilms: number; filmsWatched: number; reached: boolean } | null;
      };
    expect((await summary()).goal).toBeNull();

    const film = await FILM.seed("Goal Summary");
    await films.logId(jar, film.tmdbId, `${THIS_YEAR}-01-01`);
    await setGoal(jar, THIS_YEAR, { targetFilms: 1 });
    expect((await summary()).goal).toMatchObject({ year: THIS_YEAR, targetFilms: 1, filmsWatched: 1, reached: true });
  });
});
