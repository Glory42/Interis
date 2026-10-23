import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { and, eq } from "drizzle-orm";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestSerial } from "../../support/factories/media.factory";
import type { CookieJar } from "../../support/app/cookie-jar";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import { user } from "../../../src/infrastructure/database/auth.entity";
import {
  serialDiaryEntries,
  serialEpisodeInteractions,
  serialInteractions,
  serialSeasonInteractions,
  tvSeries,
} from "../../../src/modules/serials/serials.entity";

// #69: a season / series cascade that can't load its episode list from TMDB
// fails the request instead of saving the flag with no episodes behind it.
// TMDB is stubbed per season: a season in `tmdbSeasons` answers, any other
// season fails like TMDB being down.
describe("season cascades when TMDB is unavailable", () => {
  let testServer: RunningTestServer | null = null;
  const originalFetch = globalThis.fetch;
  const tmdbSeasons = new Map<string, number[]>();

  const getServer = (): RunningTestServer => {
    if (!testServer) throw new Error("Test server is not running");
    return testServer;
  };

  beforeAll(async () => {
    globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : input.toString();
      const match = url.match(/api\.themoviedb\.org\/3\/tv\/(\d+)\/season\/(\d+)/);
      if (!url.includes("api.themoviedb.org")) return originalFetch(input, init);

      const episodes = match ? tmdbSeasons.get(`${match[1]}:${match[2]}`) : undefined;
      if (!match || !episodes) return new Response("down", { status: 404 });

      const seasonNumber = Number(match[2]);
      return Response.json({
        id: seasonNumber,
        season_number: seasonNumber,
        poster_path: null,
        episodes: episodes.map((episodeNumber) => ({
          id: episodeNumber,
          episode_number: episodeNumber,
          season_number: seasonNumber,
          still_path: null,
        })),
      });
    }) as typeof fetch;
    testServer = await startTestServer();
  });

  afterAll(async () => {
    globalThis.fetch = originalFetch;
    if (!testServer) return;
    await testServer.close();
    testServer = null;
  });

  const seedSerial = async (title: string, numberOfSeasons: number) => {
    const serial = await seedTestSerial(title);
    await db
      .update(tvSeries)
      .set({ numberOfSeasons, numberOfEpisodes: numberOfSeasons * 3, firstAirYear: 2020 })
      .where(eq(tvSeries.id, serial.id));
    return serial;
  };

  const signUpWithId = async (prefix: string) => {
    const signedUp = await signUpTestUser(getServer().baseUrl, prefix);
    const [row] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, signedUp.username));
    return { ...signedUp, userId: row!.id };
  };

  const put = (jar: CookieJar, path: string, body: unknown) =>
    apiRequest(
      getServer().baseUrl,
      path,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
      jar,
    );

  const watchedEpisodes = async (seriesId: number) =>
    (
      await db
        .select({ episodeNumber: serialEpisodeInteractions.episodeNumber })
        .from(serialEpisodeInteractions)
        .where(
          and(
            eq(serialEpisodeInteractions.seriesId, seriesId),
            eq(serialEpisodeInteractions.watched, true),
          ),
        )
    )
      .map((row) => row.episodeNumber)
      .sort();

  const seasonRow = async (seriesId: number, seasonNumber: number) => {
    const [row] = await db
      .select({ watched: serialSeasonInteractions.watched })
      .from(serialSeasonInteractions)
      .where(
        and(
          eq(serialSeasonInteractions.seriesId, seriesId),
          eq(serialSeasonInteractions.seasonNumber, seasonNumber),
        ),
      );
    return row ?? null;
  };

  it("marking a season watched while TMDB is down fails and saves nothing", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "cascdown");
    const serial = await seedSerial("Season Down", 1);

    const response = await put(jar, `/api/serials/${serial.tmdbId}/seasons/1/interaction`, {
      watched: true,
    });
    expect(response.status).toBe(503);
    expect(await seasonRow(serial.id, 1)).toBeNull();
    expect(await watchedEpisodes(serial.id)).toEqual([]);
  });

  it("marking a season watched checks every episode TMDB lists", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "cascup");
    const serial = await seedSerial("Season Up", 1);
    tmdbSeasons.set(`${serial.tmdbId}:1`, [1, 2, 3]);

    const response = await put(jar, `/api/serials/${serial.tmdbId}/seasons/1/interaction`, {
      watched: true,
    });
    expect(response.status).toBe(200);
    expect(await watchedEpisodes(serial.id)).toEqual([1, 2, 3]);
  });

  it("unwatching a season works while TMDB is down", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "cascunw");
    const serial = await seedSerial("Season Unwatch", 1);
    tmdbSeasons.set(`${serial.tmdbId}:1`, [1, 2, 3]);
    await put(jar, `/api/serials/${serial.tmdbId}/seasons/1/interaction`, { watched: true });
    tmdbSeasons.delete(`${serial.tmdbId}:1`);

    const response = await put(jar, `/api/serials/${serial.tmdbId}/seasons/1/interaction`, {
      watched: false,
    });
    expect(response.status).toBe(200);
    expect(await seasonRow(serial.id, 1)).toEqual({ watched: false });
    expect(await watchedEpisodes(serial.id)).toEqual([]);
  });

  it("unchecking an episode while TMDB is down unmarks its season", async () => {
    const { jar, userId } = await signUpWithId("cascepi");
    const serial = await seedSerial("Episode Uncheck", 1);
    const episodePath = (n: number) =>
      `/api/serials/${serial.tmdbId}/seasons/1/episodes/${n}/interaction`;
    expect((await put(jar, episodePath(1), { watched: true })).status).toBe(200);
    expect((await put(jar, episodePath(2), { watched: true })).status).toBe(200);
    await db
      .insert(serialSeasonInteractions)
      .values({ userId, seriesId: serial.id, seasonNumber: 1, watched: true });

    expect((await put(jar, episodePath(2), { watched: false })).status).toBe(200);
    expect(await seasonRow(serial.id, 1)).toEqual({ watched: false });
  });

  it("marking a series watched fails if any season can't be loaded, and saves nothing", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "cascser");
    const serial = await seedSerial("Series Half Down", 2);
    tmdbSeasons.set(`${serial.tmdbId}:1`, [1, 2, 3]);

    const response = await put(jar, `/api/serials/${serial.tmdbId}/interaction`, {
      watched: true,
    });
    expect(response.status).toBe(503);
    expect(await watchedEpisodes(serial.id)).toEqual([]);
    expect(await seasonRow(serial.id, 1)).toBeNull();
    const [interaction] = await db
      .select({ watchStatus: serialInteractions.watchStatus })
      .from(serialInteractions)
      .where(eq(serialInteractions.seriesId, serial.id));
    expect(interaction?.watchStatus ?? null).toBeNull();
  });

  it("logging a series fails while TMDB is down and creates no diary entry", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "casclog");
    const serial = await seedSerial("Log Down", 1);

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/log`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ watchedDate: "2026-01-01" }),
      },
      jar,
    );
    expect(response.status).toBe(503);
    const entries = await db
      .select({ id: serialDiaryEntries.id })
      .from(serialDiaryEntries)
      .where(eq(serialDiaryEntries.seriesId, serial.id));
    expect(entries).toEqual([]);
  });
});
