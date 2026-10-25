import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { and, eq } from "drizzle-orm";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestSerial } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import {
  serialEpisodeInteractions,
  serialSeasonInteractions,
  tvSeries,
} from "../../../src/modules/serials/serials.entity";

// Logging a series marks it and every episode watched. Deleting the log
// keeps that unless asked; asked, the series and its episodes are unmarked
// only once no log of it is left (#88). TMDB is stubbed with two episodes
// per season.
describe("deleting a series log and its watched episodes", () => {
  let testServer: RunningTestServer | null = null;
  const originalFetch = globalThis.fetch;

  const getServer = (): RunningTestServer => {
    if (!testServer) throw new Error("Test server is not running");
    return testServer;
  };

  beforeAll(async () => {
    globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : input.toString();
      const match = url.match(/api\.themoviedb\.org\/3\/tv\/\d+\/season\/(\d+)/);
      if (!match) return originalFetch(input, init);

      const seasonNumber = Number(match[1]);
      return Response.json({
        id: seasonNumber,
        season_number: seasonNumber,
        poster_path: null,
        episodes: [1, 2].map((episodeNumber) => ({
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

  const seedSerial = async (title: string) => {
    const serial = await seedTestSerial(title);
    await db
      .update(tvSeries)
      .set({ numberOfSeasons: 1, numberOfEpisodes: 2, firstAirYear: 2020 })
      .where(eq(tvSeries.id, serial.id));
    return serial;
  };

  const send = async (jar: CookieJar, method: string, path: string, body?: unknown) => {
    const response = await apiRequest(
      getServer().baseUrl,
      path,
      {
        method,
        headers: body === undefined ? {} : { "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      jar,
    );
    expect(response.status).toBeLessThan(300);
    return (await response.json().catch(() => null)) as Record<string, unknown> | null;
  };

  const logSerial = async (jar: CookieJar, tmdbId: number) =>
    ((await send(jar, "POST", `/api/serials/${tmdbId}/log`, { watchedDate: "2026-01-01" })) as {
      entry: { id: string };
    }).entry.id;

  const watchedState = async (jar: CookieJar, serial: { id: number; tmdbId: number }) => {
    const [interaction, episodes, seasons] = await Promise.all([
      send(jar, "GET", `/api/serials/${serial.tmdbId}/interaction`),
      db
        .select({ episodeNumber: serialEpisodeInteractions.episodeNumber })
        .from(serialEpisodeInteractions)
        .where(
          and(
            eq(serialEpisodeInteractions.seriesId, serial.id),
            eq(serialEpisodeInteractions.watched, true),
          ),
        ),
      db
        .select({ seasonNumber: serialSeasonInteractions.seasonNumber })
        .from(serialSeasonInteractions)
        .where(
          and(
            eq(serialSeasonInteractions.seriesId, serial.id),
            eq(serialSeasonInteractions.watched, true),
          ),
        ),
    ]);
    return {
      watched: interaction?.watched,
      watchedEpisodes: episodes.length,
      watchedSeasons: seasons.length,
    };
  };

  const allWatched = { watched: true, watchedEpisodes: 2, watchedSeasons: 1 };

  it("keeps the series and its episodes watched by default", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "dsukeep");
    const serial = await seedSerial("Kept Series");
    const entryId = await logSerial(jar, serial.tmdbId);
    expect(await watchedState(jar, serial)).toEqual(allWatched);

    expect(await send(jar, "DELETE", `/api/serials/logs/${entryId}`)).toEqual({
      success: true,
      unwatched: false,
    });
    expect(await watchedState(jar, serial)).toEqual(allWatched);
  });

  it("unmarks the series and its episodes when its last log goes and that is asked", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "dsulast");
    const serial = await seedSerial("Unwatched Series");
    const entryId = await logSerial(jar, serial.tmdbId);

    expect(await send(jar, "DELETE", `/api/serials/logs/${entryId}?unwatch=true`)).toEqual({
      success: true,
      unwatched: true,
    });
    expect(await watchedState(jar, serial)).toEqual({
      watched: false,
      watchedEpisodes: 0,
      watchedSeasons: 0,
    });
  });

  it("keeps everything watched while another log of the series remains", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "dsumore");
    const serial = await seedSerial("Twice Logged Series");
    const firstId = await logSerial(jar, serial.tmdbId);
    await logSerial(jar, serial.tmdbId);

    expect(await send(jar, "DELETE", `/api/serials/logs/${firstId}?unwatch=true`)).toEqual({
      success: true,
      unwatched: false,
    });
    expect(await watchedState(jar, serial)).toEqual(allWatched);
  });

  it("rejects an unreadable unwatch value", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "dsubad");
    const serial = await seedSerial("Bad Query Series");
    const entryId = await logSerial(jar, serial.tmdbId);

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/serials/logs/${entryId}?unwatch=maybe`,
      { method: "DELETE" },
      jar,
    );
    expect(response.status).toBe(400);
  });
});
