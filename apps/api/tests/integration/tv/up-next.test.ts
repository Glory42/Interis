import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { eq } from "drizzle-orm";
import * as RealBaseClient from "../../../src/infrastructure/tmdb/base-client";
import { db } from "../../../src/infrastructure/database/db";
import { seriesEpisodeInteractions, tvSeries } from "../../../src/modules/tv/tv.entity";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestSeries } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";

// Days relative to the real "today" (UTC), since the route reads the clock.
const day = (offset: number): string => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};

type FakeSeason = { number: number; airDates: (string | null)[] };
type FakeSeries = {
  seasons: FakeSeason[];
  nextToAir?: { season: number; episode: number; airDate: string };
  lastToAir?: { season: number; episode: number; airDate: string };
  fails?: boolean;
};

const fakeSeries = new Map<number, FakeSeries>();
const realFetchTMDB = RealBaseClient.fetchTMDB;

const episodeToAir = (input: { season: number; episode: number; airDate: string }) => ({
  id: input.season * 100 + input.episode,
  name: `S${input.season}E${input.episode}`,
  season_number: input.season,
  episode_number: input.episode,
  air_date: input.airDate,
});

const detailFixture = (tmdbId: number, series: FakeSeries) => ({
  id: tmdbId,
  name: `Series ${tmdbId}`,
  poster_path: null,
  backdrop_path: null,
  episode_run_time: [45],
  number_of_seasons: series.seasons.length,
  number_of_episodes: series.seasons.reduce((sum, season) => sum + season.airDates.length, 0),
  next_episode_to_air: series.nextToAir ? episodeToAir(series.nextToAir) : null,
  last_episode_to_air: series.lastToAir ? episodeToAir(series.lastToAir) : null,
  seasons: series.seasons.map((season) => ({
    id: season.number,
    name: season.number === 0 ? "Specials" : `Season ${season.number}`,
    season_number: season.number,
    episode_count: season.airDates.length,
    air_date: season.airDates[0] ?? null,
    poster_path: null,
  })),
});

const seasonFixture = (season: FakeSeason) => ({
  id: season.number,
  name: `Season ${season.number}`,
  season_number: season.number,
  poster_path: null,
  episodes: season.airDates.map((airDate, index) => ({
    id: season.number * 100 + index + 1,
    name: `Title S${season.number}E${index + 1}`,
    episode_number: index + 1,
    season_number: season.number,
    still_path: `/still-${season.number}-${index + 1}.jpg`,
    air_date: airDate,
    runtime: index === 0 ? 58 : null,
  })),
});

void mock.module("../../../src/infrastructure/tmdb/base-client", () => ({
  ...RealBaseClient,
  fetchTMDB: (endpoint: string) => {
    const match = /^\/tv\/(-?\d+)(?:\/season\/(\d+))?\?/.exec(endpoint);
    const series = match ? fakeSeries.get(Number(match[1])) : undefined;
    if (!match || !series) return realFetchTMDB(endpoint);
    if (series.fails) return Promise.reject(new Error("TMDB Error: 500 Internal Server Error"));
    if (match[2] === undefined) return Promise.resolve(detailFixture(Number(match[1]), series));
    const season = series.seasons.find((entry) => entry.number === Number(match[2]));
    return season ? Promise.resolve(seasonFixture(season)) : Promise.reject(new Error("TMDB Error: 404 Not Found"));
  },
}));

type Episode = { seasonNumber: number; episodeNumber: number; name: string; stillPath: string | null; airDate: string | null; runtime: number | null };
type UpNextBody = {
  today: string;
  upNext: { series: { tmdbId: number }; episode: Episode; newEpisodesCount: number }[];
  airingSoon: { date: string; episodes: { series: { tmdbId: number }; episode: Episode; source: string }[] }[];
};

describe("GET /api/serials/up-next", () => {
  let testServer: RunningTestServer | null = null;
  let jar: CookieJar;
  const ids = { boundary: 0, returning: 0, completed: 0, broken: 0, watchlisted: 0 };

  const server = (): RunningTestServer => {
    if (!testServer) throw new Error("Test server is not running");
    return testServer;
  };

  const send = (path: string, method: string, body: unknown, cookieJar = jar) =>
    apiRequest(
      server().baseUrl,
      path,
      { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
      cookieJar,
    );

  const watchThrough = async (tmdbId: number, season: number, episode: number) => {
    const response = await apiRequest(
      server().baseUrl,
      `/api/serials/${tmdbId}/seasons/${season}/watched-through/${episode}`,
      { method: "POST" },
      jar,
    );
    expect(response.status).toBe(200);
  };

  const seed = async (key: keyof typeof ids, series: FakeSeries) => {
    const { id, tmdbId } = await seedTestSeries(`Up next ${key}`);
    const total = series.seasons.filter((season) => season.number > 0).reduce((sum, season) => sum + season.airDates.length, 0);
    await db.update(tvSeries).set({ numberOfEpisodes: total }).where(eq(tvSeries.id, id));
    fakeSeries.set(tmdbId, series);
    ids[key] = tmdbId;
    return id;
  };

  const getUpNext = async (cookieJar = jar) => {
    const response = await apiRequest(server().baseUrl, "/api/serials/up-next", {}, cookieJar);
    expect(response.status).toBe(200);
    return (await response.json()) as UpNextBody;
  };

  beforeAll(async () => {
    testServer = await startTestServer();
    ({ jar } = await signUpTestUser(server().baseUrl, "upnext"));

    const past = [day(-400), day(-393), day(-386)];
    await seed("boundary", { seasons: [{ number: 0, airDates: [day(-500), day(-450), day(-420)] }, { number: 1, airDates: past }, { number: 2, airDates: [day(-30), day(-23), day(-16)] }] });
    const returningId = await seed("returning", {
      seasons: [
        { number: 1, airDates: past },
        { number: 2, airDates: [day(-3), day(-2), day(5), day(12), day(20)] },
      ],
      nextToAir: { season: 2, episode: 3, airDate: day(5) },
      lastToAir: { season: 2, episode: 2, airDate: day(-2) },
    });
    await seed("completed", { seasons: [{ number: 1, airDates: [day(-60), day(-53)] }] });
    const broken: FakeSeries = { seasons: [{ number: 1, airDates: past }] };
    await seed("broken", broken);
    await seed("watchlisted", { seasons: [{ number: 1, airDates: [day(1), day(8)] }], nextToAir: { season: 1, episode: 1, airDate: day(1) } });

    // Returning was watched a month ago; Boundary (specials and all of season 1) just now.
    await watchThrough(ids.returning, 1, 3);
    await db
      .update(seriesEpisodeInteractions)
      .set({ updatedAt: new Date(Date.now() - 30 * 86_400_000) })
      .where(eq(seriesEpisodeInteractions.seriesId, returningId));
    await watchThrough(ids.completed, 1, 2);
    await watchThrough(ids.broken, 1, 1);
    await watchThrough(ids.boundary, 0, 3);
    await watchThrough(ids.boundary, 1, 3);
    // Broken's TMDB goes down only after it was tracked.
    broken.fails = true;
    expect((await send(`/api/serials/${ids.watchlisted}/interaction`, "PUT", { watchlisted: true })).status).toBe(200);
  });

  afterAll(async () => {
    if (!testServer) return;
    await testServer.close();
    testServer = null;
  });

  it("requires a signed-in viewer", async () => {
    const response = await apiRequest(server().baseUrl, "/api/serials/up-next");
    expect(response.status).toBe(401);
  });

  it("lists the next aired episode across a season boundary, ignoring specials, most recently watched first", async () => {
    const body = await getUpNext();
    expect(body.today).toBe(day(0));
    expect(body.upNext.map((item) => item.series.tmdbId)).toEqual([ids.boundary, ids.returning]);
    expect(body.upNext[0]!.episode).toEqual({
      seasonNumber: 2,
      episodeNumber: 1,
      name: "Title S2E1",
      stillPath: "/still-2-1.jpg",
      airDate: day(-30),
      runtime: 58,
    });
  });

  it("leaves out completed series and drops a series whose TMDB lookup fails", async () => {
    const body = await getUpNext();
    const listed = [...body.upNext.map((item) => item.series.tmdbId), ...body.airingSoon.flatMap((group) => group.episodes.map((entry) => entry.series.tmdbId))];
    expect(listed).not.toContain(ids.completed);
    expect(listed).not.toContain(ids.broken);
  });

  it("counts episodes that dropped since the viewer last watched a returning series", async () => {
    const returning = (await getUpNext()).upNext.find((item) => item.series.tmdbId === ids.returning);
    expect(returning?.episode).toMatchObject({ seasonNumber: 2, episodeNumber: 1, runtime: 58 });
    expect(returning?.newEpisodesCount).toBe(2);
    const boundary = (await getUpNext()).upNext.find((item) => item.series.tmdbId === ids.boundary);
    expect(boundary?.newEpisodesCount).toBe(0);
  });

  it("groups episodes airing in the next 14 days by date, watchlisted series included", async () => {
    const { airingSoon } = await getUpNext();
    expect(airingSoon.map((group) => group.date)).toEqual([day(1), day(5), day(8), day(12)]);
    const flat = airingSoon.flatMap((group) => group.episodes.map((entry) => ({ tmdbId: entry.series.tmdbId, code: `${entry.episode.seasonNumber}:${entry.episode.episodeNumber}`, source: entry.source })));
    expect(flat).toEqual([
      { tmdbId: ids.watchlisted, code: "1:1", source: "watchlist" },
      { tmdbId: ids.returning, code: "2:3", source: "watching" },
      { tmdbId: ids.watchlisted, code: "1:2", source: "watchlist" },
      { tmdbId: ids.returning, code: "2:4", source: "watching" },
    ]);
  });

  it("advances to the following episode once the next one is marked watched, and drops a caught-up series", async () => {
    expect((await send(`/api/serials/${ids.boundary}/seasons/2/episodes/1/interaction`, "PUT", { watched: true })).status).toBe(200);
    await watchThrough(ids.returning, 2, 2);

    const { upNext } = await getUpNext();
    expect(upNext.map((item) => [item.series.tmdbId, item.episode.seasonNumber, item.episode.episodeNumber])).toEqual([
      [ids.boundary, 2, 2],
    ]);
  });

  it("is empty for a viewer watching nothing", async () => {
    const { jar: strangerJar } = await signUpTestUser(server().baseUrl, "upnextnone");
    const body = await getUpNext(strangerJar);
    expect(body.upNext).toEqual([]);
    expect(body.airingSoon).toEqual([]);
  });
});
