import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../../../src/infrastructure/database/db";
import { films } from "../../../src/modules/films/films.entity";
import { tvSeries } from "../../../src/modules/tv/tv.entity";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestFilm, seedTestSeries } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";

describe("list detail items", () => {
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
    return response.json();
  };

  it("carries the owner's rating and the director or creator on each item", async () => {
    const owner = await signUpTestUser(getServer().baseUrl, "lstowner");
    const viewer = await signUpTestUser(getServer().baseUrl, "lstviewer");
    const ratedFilm = await seedTestFilm("List Rated Film");
    const unratedFilm = await seedTestFilm("List Unrated Film");
    const show = await seedTestSeries("List Show");
    await db.update(films).set({ director: "Jane Director" }).where(eq(films.id, ratedFilm.id));
    await db.update(tvSeries).set({ creator: "Sam Creator" }).where(eq(tvSeries.id, show.id));

    await send(owner.jar, `/api/interactions/${ratedFilm.tmdbId}`, "PUT", { rating: 8 });
    await send(owner.jar, `/api/serials/${show.tmdbId}/interaction`, "PUT", { rating: 7 });
    // Another person's rating must not leak onto the owner's list.
    await send(viewer.jar, `/api/interactions/${unratedFilm.tmdbId}`, "PUT", { rating: 3 });

    const list = (await send(owner.jar, "/api/lists", "POST", { title: "Owner picks" })) as { id: string };
    await send(owner.jar, `/api/lists/${list.id}/items`, "POST", { tmdbId: ratedFilm.tmdbId, itemType: "movie" });
    await send(owner.jar, `/api/lists/${list.id}/items`, "POST", { tmdbId: unratedFilm.tmdbId, itemType: "movie" });
    await send(owner.jar, `/api/lists/${list.id}/items`, "POST", { tmdbId: show.tmdbId, itemType: "serial" });

    const response = await apiRequest(getServer().baseUrl, `/api/lists/${list.id}`, {}, viewer.jar);
    const detail = (await response.json()) as {
      items: { tmdbId: number; ownerRating: number | null; credit: string | null }[];
    };

    expect(detail.items.map(({ tmdbId, ownerRating, credit }) => ({ tmdbId, ownerRating, credit }))).toEqual([
      { tmdbId: ratedFilm.tmdbId, ownerRating: 8, credit: "Jane Director" },
      { tmdbId: unratedFilm.tmdbId, ownerRating: null, credit: null },
      { tmdbId: show.tmdbId, ownerRating: 7, credit: "Sam Creator" },
    ]);
  });
});
