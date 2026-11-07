import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { promoteToAdmin } from "../../support/factories/admin.factory";
import { seedTestMovie, seedTestSerial } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import { movies } from "../../../src/modules/movies/movies.entity";

type CacheSummary = {
  startedAt: string;
  memory: { hits: number; misses: number };
  titles: { movies: number; serials: number };
  unreferenced: { movies: number; serials: number };
};

describe("admin cache tools", () => {
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

  const send = (path: string, method: string, body: unknown, jar?: CookieJar) =>
    apiRequest(
      getServer().baseUrl,
      path,
      body === undefined ? { method } : { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
      jar,
    );
  const json = async <T>(response: Response) => (await response.json()) as T;

  const makeAdmin = async (prefix: string) => {
    const admin = await signUpTestUser(getServer().baseUrl, prefix);
    await promoteToAdmin(admin.username);
    return admin;
  };
  const summary = async (jar: CookieJar) => json<CacheSummary>(await send("/api/admin/cache", "GET", undefined, jar));
  const movieExists = async (id: number) => (await db.select({ id: movies.id }).from(movies).where(eq(movies.id, id))).length === 1;

  it("counts titles nothing references, and leaves referenced ones out", async () => {
    const admin = await makeAdmin("cchsum");
    const before = await summary(admin.jar);

    await seedTestMovie("Nobody logged me");
    await seedTestSerial("Nobody watched me");
    const reviewed = await seedTestMovie("Someone reviewed me");
    await send("/api/reviews", "POST", { tmdbId: reviewed.tmdbId, content: "Kept" }, admin.jar);

    const after = await summary(admin.jar);
    expect(after.unreferenced.movies - before.unreferenced.movies).toBe(1);
    expect(after.unreferenced.serials - before.unreferenced.serials).toBe(1);
    expect(after.titles.movies - before.titles.movies).toBe(2);
    expect(typeof after.memory.hits).toBe("number");
    expect(Number.isNaN(Date.parse(after.startedAt))).toBe(false);
  });

  it("purges only unreferenced titles, and only with the admin's password", async () => {
    const admin = await makeAdmin("cchpurge");
    const orphan = await seedTestMovie("Purge me");
    const kept = await seedTestMovie("Keep me");
    await send("/api/reviews", "POST", { tmdbId: kept.tmdbId, content: "Still here" }, admin.jar);

    expect((await send("/api/admin/cache/purge", "POST", {}, admin.jar)).status).toBe(401);
    expect((await send("/api/admin/cache/purge", "POST", { adminPassword: "wrong-password-1" }, admin.jar)).status).toBe(401);
    expect(await movieExists(orphan.id)).toBe(true);

    const purged = await send("/api/admin/cache/purge", "POST", { adminPassword: admin.password }, admin.jar);
    expect(purged.status).toBe(200);
    expect((await json<{ movies: number }>(purged)).movies).toBeGreaterThanOrEqual(1);
    expect(await movieExists(orphan.id)).toBe(false);
    expect(await movieExists(kept.id)).toBe(true);
    expect((await summary(admin.jar)).unreferenced.movies).toBe(0);

    const audit = await json<{ items: { action: string }[] }>(await send(`/api/admin/audit?actor=${admin.username}`, "GET", undefined, admin.jar));
    expect(audit.items[0]?.action).toBe("cache.purge");
  });

  it("refreshes the oldest cached titles first, at most 25", async () => {
    const admin = await makeAdmin("cchold");
    const stale = await seedTestMovie("Cached long ago");
    await db.update(movies).set({ cachedAt: new Date("1990-01-01T00:00:00Z") }).where(eq(movies.id, stale.id));

    const response = await send("/api/admin/cache/refresh-oldest", "POST", { kind: "movie" }, admin.jar);
    expect(response.status).toBe(200);
    const { titles } = await json<{ titles: { id: number; ok: boolean }[] }>(response);
    expect(titles.map((title) => title.id)).toContain(stale.id);
    expect(titles.length).toBeLessThanOrEqual(25);
  });
});
