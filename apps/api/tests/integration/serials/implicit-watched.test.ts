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
import {
  serialEpisodeInteractions,
  tvSeries,
} from "../../../src/modules/serials/serials.entity";

// #66: liking / rating an episode marks it watched, and undoing that like /
// rating takes the watch back unless the user checked it themselves. Liking
// or rating a whole series marks nothing.
describe("implicit watched from likes and ratings", () => {
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

  const seedSerial = async (title: string) => {
    const serial = await seedTestSerial(title);
    await db
      .update(tvSeries)
      .set({ numberOfEpisodes: 10, numberOfSeasons: 1, firstAirYear: 2020 })
      .where(eq(tvSeries.id, serial.id));
    return serial;
  };

  const put = async (jar: CookieJar, path: string, body: unknown) => {
    const response = await apiRequest(
      getServer().baseUrl,
      path,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
      jar,
    );
    expect(response.status).toBe(200);
    return (await response.json()) as { watched: boolean; watchStatus?: string | null };
  };

  const episodePath = (tmdbId: number, episodeNumber: number) =>
    `/api/serials/${tmdbId}/seasons/1/episodes/${episodeNumber}/interaction`;

  const getStatus = async (jar: CookieJar, tmdbId: number) => {
    const response = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${tmdbId}/interaction`,
      {},
      jar,
    );
    return ((await response.json()) as { watchStatus: string | null }).watchStatus;
  };

  it("unliking an episode that was only liked unwatches it and clears the status", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "imlike");
    const serial = await seedSerial("Implicit Like Serial");

    expect((await put(jar, episodePath(serial.tmdbId, 1), { liked: true })).watched).toBe(true);
    expect(await getStatus(jar, serial.tmdbId)).toBe("watching");

    expect((await put(jar, episodePath(serial.tmdbId, 1), { liked: false })).watched).toBe(false);
    expect(await getStatus(jar, serial.tmdbId)).toBeNull();
  });

  it("removing the rating keeps the watch while the episode is still liked", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "imrate");
    const serial = await seedSerial("Implicit Rate Serial");

    await put(jar, episodePath(serial.tmdbId, 1), { liked: true, rating: 8 });
    expect((await put(jar, episodePath(serial.tmdbId, 1), { rating: null })).watched).toBe(true);
    expect((await put(jar, episodePath(serial.tmdbId, 1), { liked: false })).watched).toBe(false);
  });

  it("an episode the user checked stays watched after unliking", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "imexplicit");
    const serial = await seedSerial("Explicit Watch Serial");

    await put(jar, episodePath(serial.tmdbId, 1), { watched: true });
    await put(jar, episodePath(serial.tmdbId, 1), { liked: true });
    expect((await put(jar, episodePath(serial.tmdbId, 1), { liked: false })).watched).toBe(true);
  });

  it("checking an implicitly watched episode makes the watch explicit", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "imconfirm");
    const serial = await seedSerial("Confirmed Watch Serial");

    await put(jar, episodePath(serial.tmdbId, 1), { liked: true });
    await put(jar, episodePath(serial.tmdbId, 1), { watched: true });
    expect((await put(jar, episodePath(serial.tmdbId, 1), { liked: false })).watched).toBe(true);
  });

  it("liking or rating a series marks no episode watched and sets no status", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "imseries");
    const serial = await seedSerial("Liked Series");

    const body = await put(jar, `/api/serials/${serial.tmdbId}/interaction`, {
      liked: true,
      rating: 9,
    });
    expect(body).toMatchObject({ watched: false, watchStatus: null });

    const watchedRows = await db
      .select({ episodeNumber: serialEpisodeInteractions.episodeNumber })
      .from(serialEpisodeInteractions)
      .where(
        and(
          eq(serialEpisodeInteractions.seriesId, serial.id),
          eq(serialEpisodeInteractions.watched, true),
        ),
      );
    expect(watchedRows).toEqual([]);
  });

  it("liking a series keeps a dropped status", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "imdropped");
    const serial = await seedSerial("Dropped Then Liked");

    await put(jar, episodePath(serial.tmdbId, 1), { watched: true });
    await put(jar, `/api/serials/${serial.tmdbId}/interaction`, { watchStatus: "dropped" });
    expect(
      await put(jar, `/api/serials/${serial.tmdbId}/interaction`, { liked: true }),
    ).toMatchObject({ watchStatus: "dropped" });
  });
});
