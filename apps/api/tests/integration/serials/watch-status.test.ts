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
  serialEpisodeInteractions,
  serialInteractions,
  tvSeries,
} from "../../../src/modules/serials/serials.entity";
import { SerialsWatchStatusService } from "../../../src/modules/serials/services/serials-watch-status.service";

type InteractionState = { watched: boolean; watchStatus: string | null };

// The stored series watch status (#65). Every scenario runs offline: TMDB
// season lookups are .catch()-guarded, so episode toggles drive the status
// from the seeded series' episode count alone.
describe("series watch status", () => {
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

  const seedSerial = async (title: string, numberOfEpisodes: number) => {
    const serial = await seedTestSerial(title);
    await db
      .update(tvSeries)
      .set({ numberOfEpisodes, numberOfSeasons: 1, firstAirYear: 2020 })
      .where(eq(tvSeries.id, serial.id));
    return serial;
  };

  const toggleEpisode = async (
    jar: CookieJar,
    tmdbId: number,
    episodeNumber: number,
    watched: boolean,
  ) => {
    const response = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${tmdbId}/seasons/1/episodes/${episodeNumber}/interaction`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ watched }),
      },
      jar,
    );
    expect(response.status).toBe(200);
  };

  const putInteraction = async (jar: CookieJar, tmdbId: number, body: unknown) =>
    apiRequest(
      getServer().baseUrl,
      `/api/serials/${tmdbId}/interaction`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
      jar,
    );

  const getInteraction = async (jar: CookieJar, tmdbId: number) => {
    const response = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${tmdbId}/interaction`,
      {},
      jar,
    );
    expect(response.status).toBe(200);
    return (await response.json()) as InteractionState;
  };

  const listTmdbIds = async (username: string, list: "currently-watching" | "watched") => {
    const response = await apiRequest(
      getServer().baseUrl,
      `/api/public/${username}/serials/${list}`,
    );
    expect(response.status).toBe(200);
    return ((await response.json()) as Array<{ tmdbId: number }>).map((item) => item.tmdbId);
  };

  const userIdFor = async (username: string) => {
    const [row] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, username));
    if (!row) throw new Error(`No user ${username}`);
    return row.id;
  };

  it("completes a series finished episode by episode and lists it as watched (#68)", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "wsfinish");
    const serial = await seedSerial("Finished By Episodes", 2);

    await toggleEpisode(jar, serial.tmdbId, 1, true);
    expect(await getInteraction(jar, serial.tmdbId)).toMatchObject({
      watched: false,
      watchStatus: "watching",
    });

    await toggleEpisode(jar, serial.tmdbId, 2, true);
    expect(await getInteraction(jar, serial.tmdbId)).toMatchObject({
      watched: true,
      watchStatus: "completed",
    });
    expect(await listTmdbIds(username, "watched")).toContain(serial.tmdbId);
    expect(await listTmdbIds(username, "currently-watching")).not.toContain(serial.tmdbId);
  });

  it("unchecking the finale moves a completed series back to watching (#67)", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "wsfinale");
    const serial = await seedSerial("Unchecked Finale", 2);

    await toggleEpisode(jar, serial.tmdbId, 1, true);
    await toggleEpisode(jar, serial.tmdbId, 2, true);
    await toggleEpisode(jar, serial.tmdbId, 2, false);

    expect(await getInteraction(jar, serial.tmdbId)).toMatchObject({
      watched: false,
      watchStatus: "watching",
    });
    expect(await listTmdbIds(username, "watched")).not.toContain(serial.tmdbId);
    expect(await listTmdbIds(username, "currently-watching")).toContain(serial.tmdbId);
  });

  it("dropping keeps episode history but leaves currently watching; a new episode resumes it", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "wsdrop");
    const serial = await seedSerial("Dropped Serial", 10);

    await toggleEpisode(jar, serial.tmdbId, 1, true);
    await toggleEpisode(jar, serial.tmdbId, 2, true);

    const drop = await putInteraction(jar, serial.tmdbId, { watchStatus: "dropped" });
    expect(drop.status).toBe(200);
    expect(await drop.json()).toMatchObject({ watched: false, watchStatus: "dropped" });
    expect(await listTmdbIds(username, "currently-watching")).not.toContain(serial.tmdbId);

    const watchedRows = await db
      .select({ episodeNumber: serialEpisodeInteractions.episodeNumber })
      .from(serialEpisodeInteractions)
      .where(
        and(
          eq(serialEpisodeInteractions.seriesId, serial.id),
          eq(serialEpisodeInteractions.watched, true),
        ),
      );
    expect(watchedRows).toHaveLength(2);

    // Unchecking while dropped doesn't revive it...
    await toggleEpisode(jar, serial.tmdbId, 2, false);
    expect((await getInteraction(jar, serial.tmdbId)).watchStatus).toBe("dropped");

    // ...but checking a new episode does.
    await toggleEpisode(jar, serial.tmdbId, 3, true);
    expect((await getInteraction(jar, serial.tmdbId)).watchStatus).toBe("watching");
    expect(await listTmdbIds(username, "currently-watching")).toContain(serial.tmdbId);
  });

  it("pause and resume", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "wspause");
    const serial = await seedSerial("Paused Serial", 10);

    await toggleEpisode(jar, serial.tmdbId, 1, true);
    expect((await (await putInteraction(jar, serial.tmdbId, { watchStatus: "paused" })).json()))
      .toMatchObject({ watchStatus: "paused" });

    const resume = await putInteraction(jar, serial.tmdbId, { watchStatus: "watching" });
    expect(await resume.json()).toMatchObject({ watchStatus: "watching" });
  });

  it("rejects setting completed directly; that goes through the watched toggle", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "wsbad");
    const serial = await seedSerial("Bad Status Serial", 10);

    const response = await putInteraction(jar, serial.tmdbId, { watchStatus: "completed" });
    expect(response.status).toBe(400);
  });

  it("the watched toggle sets completed and clears to no status", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "wstoggle");
    const serial = await seedSerial("Toggled Serial", 10);

    expect(await (await putInteraction(jar, serial.tmdbId, { watched: true })).json())
      .toMatchObject({ watched: true, watchStatus: "completed" });
    expect(await (await putInteraction(jar, serial.tmdbId, { watched: false })).json())
      .toMatchObject({ watched: false, watchStatus: null });
  });

  it("reviewing a series mid-watch keeps it watching", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "wsreview");
    const serial = await seedSerial("Reviewed Mid Season", 10);

    await toggleEpisode(jar, serial.tmdbId, 1, true);
    const review = await apiRequest(
      getServer().baseUrl,
      "/api/reviews",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mediaType: "tv", tmdbId: serial.tmdbId, content: "Good so far." }),
      },
      jar,
    );
    expect(review.status).toBeLessThan(300);

    expect((await getInteraction(jar, serial.tmdbId)).watchStatus).toBe("watching");
    expect(await listTmdbIds(username, "currently-watching")).toContain(serial.tmdbId);
  });

  it("new episodes reopen series finished episode by episode, not log-only completions", async () => {
    const tracked = await signUpTestUser(getServer().baseUrl, "wsreopen");
    const logOnly = await signUpTestUser(getServer().baseUrl, "wslogonly");
    const serial = await seedSerial("Renewed Serial", 2);

    await toggleEpisode(tracked.jar, serial.tmdbId, 1, true);
    await toggleEpisode(tracked.jar, serial.tmdbId, 2, true);
    await putInteraction(logOnly.jar, serial.tmdbId, { watched: true });

    await SerialsWatchStatusService.reopenAfterNewEpisodes(serial.id, 2, 4);

    const statusFor = async (userId: string) => {
      const [row] = await db
        .select({ watchStatus: serialInteractions.watchStatus })
        .from(serialInteractions)
        .where(
          and(eq(serialInteractions.userId, userId), eq(serialInteractions.seriesId, serial.id)),
        );
      return row?.watchStatus ?? null;
    };
    expect(await statusFor(await userIdFor(tracked.username))).toBe("watching");
    expect(await statusFor(await userIdFor(logOnly.username))).toBe("completed");
  });
});
