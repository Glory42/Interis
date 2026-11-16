import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestFilm, seedTestSeries } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import { activities } from "../../../src/modules/social/social.entity";

const waitForActivityWrite = () => new Promise((resolve) => setTimeout(resolve, 150));

describe("onboarding", () => {
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

  const send = (jar: CookieJar | undefined, method: string, path: string, body?: unknown) =>
    apiRequest(
      getServer().baseUrl,
      path,
      {
        method,
        headers: body === undefined ? {} : { "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      jar,
    );

  const getMe = async (jar: CookieJar) =>
    (await (await send(jar, "GET", "/api/users/me")).json()) as {
      id: string;
      onboardingCompletedAt: string | null;
    };

  it("requires auth on every route", async () => {
    expect((await send(undefined, "GET", "/api/onboarding/titles")).status).toBe(401);
    expect((await send(undefined, "POST", "/api/onboarding/taste", { items: [] })).status).toBe(401);
    expect((await send(undefined, "POST", "/api/onboarding/complete")).status).toBe(401);
  });

  it("starts pending for a new account and completes once", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "obdone");
    expect((await getMe(jar)).onboardingCompletedAt).toBeNull();

    const first = await send(jar, "POST", "/api/onboarding/complete");
    expect(first.status).toBe(200);
    const { onboardingCompletedAt } = (await first.json()) as { onboardingCompletedAt: string };
    expect(onboardingCompletedAt).toBeString();
    expect((await getMe(jar)).onboardingCompletedAt).toBe(onboardingCompletedAt);

    // Completing again (another tab, a double tap) keeps the first time.
    const second = (await (await send(jar, "POST", "/api/onboarding/complete")).json()) as {
      onboardingCompletedAt: string;
    };
    expect(second.onboardingCompletedAt).toBe(onboardingCompletedAt);
  });

  it("saves the taste grid as Interactions in one request, with no Activity", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "obtaste");
    const [rated, watched, series] = await Promise.all([
      seedTestFilm("Taste Rated"),
      seedTestFilm("Taste Watched"),
      seedTestSeries("Taste Series"),
    ]);

    const response = await send(jar, "POST", "/api/onboarding/taste", {
      items: [
        { mediaType: "movie", tmdbId: rated.tmdbId, watched: true, rating: 8.5 },
        { mediaType: "movie", tmdbId: watched.tmdbId, watched: true },
        { mediaType: "tv", tmdbId: series.tmdbId, watched: true, rating: 7 },
      ],
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ saved: 3, failed: [] });

    const film = await (await send(jar, "GET", `/api/interactions/${rated.tmdbId}`)).json();
    expect(film).toMatchObject({ watched: true, rating: 8.5, liked: false });
    const plain = await (await send(jar, "GET", `/api/interactions/${watched.tmdbId}`)).json();
    expect(plain).toMatchObject({ watched: true, rating: null });
    const show = await (await send(jar, "GET", `/api/serials/${series.tmdbId}/interaction`)).json();
    expect(show).toMatchObject({ watched: true, rating: 7, watchStatus: "completed" });

    await waitForActivityWrite();
    const { id } = await getMe(jar);
    expect(await db.select().from(activities).where(eq(activities.userId, id))).toHaveLength(0);

    // Unmarking on a second pass takes the title back off.
    await send(jar, "POST", "/api/onboarding/taste", {
      items: [{ mediaType: "movie", tmdbId: rated.tmdbId, watched: false }],
    });
    const undone = await (await send(jar, "GET", `/api/interactions/${rated.tmdbId}`)).json();
    expect(undone).toMatchObject({ watched: false, rating: null });
  });

  it("rejects duplicate titles, off-scale ratings and empty batches", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "obbad");
    const film = await seedTestFilm();
    const item = { mediaType: "movie", tmdbId: film.tmdbId, watched: true };

    for (const items of [[item, item], [{ ...item, rating: 11 }], [{ ...item, rating: 7.3 }], []]) {
      expect((await send(jar, "POST", "/api/onboarding/taste", { items })).status).toBe(400);
    }
  });

  it("lists the most watched titles on Interis in the grid", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "obgrid");
    const response = await send(jar, "GET", "/api/onboarding/titles");
    expect(response.status).toBe(200);
    const { items } = (await response.json()) as { items: { mediaType: string; tmdbId: number }[] };
    expect(items.length).toBeLessThanOrEqual(36);
    const keys = items.map((item) => `${item.mediaType}:${item.tmdbId}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
