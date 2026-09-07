import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestSerial } from "../../support/factories/media.factory";
import type { CookieJar } from "../../support/app/cookie-jar";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import { tvSeries } from "../../../src/modules/serials/serials.entity";

// SerialsCurrentlyWatchingService is only reachable through
// GET /api/public/:username/serials/currently-watching. The candidate query
// is pure DB (in-progress = some episodes watched, not all, series not
// marked fully watched); the per-item TMDB enrichment is .catch()-guarded,
// so the progress math is verifiable offline with a seeded series whose
// episode count we set directly.
describe("serials currently-watching (via public widget API)", () => {
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

  const watchEpisode = async (
    jar: CookieJar,
    tmdbId: number,
    seasonNumber: number,
    episodeNumber: number,
  ) =>
    apiRequest(
      getServer().baseUrl,
      `/api/serials/${tmdbId}/seasons/${seasonNumber}/episodes/${episodeNumber}/interaction`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ watched: true }),
      },
      jar,
    );

  it("lists a started-but-unfinished series with its watched-episode progress", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "cwinprogress");
    const serial = await seedTestSerial("Currently Watching Serial");
    await db
      .update(tvSeries)
      .set({ numberOfEpisodes: 10, numberOfSeasons: 1, firstAirYear: 2020 })
      .where(eq(tvSeries.id, serial.id));

    await watchEpisode(jar, serial.tmdbId, 1, 1);

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/public/${username}/serials/currently-watching`,
    );
    expect(response.status).toBe(200);

    const series = (await response.json()) as Array<{
      tmdbId: number;
      watchedEpisodesCount: number;
      numberOfEpisodes: number | null;
      progressPercent: number;
    }>;

    expect(series).toHaveLength(1);
    expect(series[0]!.tmdbId).toBe(serial.tmdbId);
    expect(series[0]!.watchedEpisodesCount).toBe(1);
    expect(series[0]!.numberOfEpisodes).toBe(10);
    expect(series[0]!.progressPercent).toBe(10);
  });

  it("excludes a series once every episode has been watched", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "cwfinished");
    const serial = await seedTestSerial("Finished Serial");
    await db
      .update(tvSeries)
      .set({ numberOfEpisodes: 1, numberOfSeasons: 1, firstAirYear: 2019 })
      .where(eq(tvSeries.id, serial.id));

    await watchEpisode(jar, serial.tmdbId, 1, 1);

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/public/${username}/serials/currently-watching`,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });
});
