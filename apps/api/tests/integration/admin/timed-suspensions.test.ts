import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../../../src/infrastructure/database/db";
import { user } from "../../../src/infrastructure/database/auth.entity";
import { profiles } from "../../../src/modules/users/users.entity";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { promoteToAdmin } from "../../support/factories/admin.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";

type Detail = { user: { isSuspended: boolean; suspendedUntil: string | null; suspendedBy: string | null } };

const DAY_MS = 86_400_000;

describe("timed suspensions", () => {
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

  const get = (path: string, jar: CookieJar) => apiRequest(getServer().baseUrl, path, {}, jar);
  const suspend = (username: string, body: Record<string, unknown>, jar: CookieJar) =>
    apiRequest(
      getServer().baseUrl,
      `/api/admin/users/${username}/suspend`,
      { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
      jar,
    );

  const setup = async (prefix: string) => {
    const admin = await signUpTestUser(getServer().baseUrl, `${prefix}a`);
    await promoteToAdmin(admin.username);
    const target = await signUpTestUser(getServer().baseUrl, `${prefix}t`);
    return { admin, target };
  };

  const profileOf = async (username: string) => {
    const [row] = await db
      .select({ isSuspended: profiles.isSuspended, suspendedUntil: profiles.suspendedUntil })
      .from(profiles)
      .innerJoin(user, eq(user.id, profiles.userId))
      .where(eq(user.username, username));
    return row!;
  };

  it("suspends for a number of days and records who did it", async () => {
    const { admin, target } = await setup("tsdays");

    const before = Date.now();
    const response = await suspend(target.username, { durationDays: 7, adminPassword: admin.password }, admin.jar);
    expect(response.status).toBe(200);
    expect((await get("/api/users/me", target.jar)).status).toBe(403);

    const detail = (await (await get(`/api/admin/users/${target.username}`, admin.jar)).json()) as Detail;
    expect(detail.user.isSuspended).toBe(true);
    expect(detail.user.suspendedBy).toBe(admin.username);
    const until = Date.parse(detail.user.suspendedUntil ?? "");
    expect(until - before).toBeGreaterThan(7 * DAY_MS - 60_000);
    expect(until - before).toBeLessThan(7 * DAY_MS + 60_000);
  });

  it("lets the user back in once the suspension ends, without touching the row", async () => {
    const { admin, target } = await setup("tsended");
    await suspend(target.username, { durationDays: 1, adminPassword: admin.password }, admin.jar);
    await db
      .update(profiles)
      .set({ suspendedUntil: new Date(Date.now() - 1000) })
      .where(eq(profiles.userId, (await db.select({ id: user.id }).from(user).where(eq(user.username, target.username)))[0]!.id));

    expect((await get("/api/users/me", target.jar)).status).toBe(200);
    expect((await profileOf(target.username)).isSuspended).toBe(true);

    const detail = (await (await get(`/api/admin/users/${target.username}`, admin.jar)).json()) as Detail;
    expect(detail.user.isSuspended).toBe(false);
  });

  it("keeps an open-ended suspension until it's lifted", async () => {
    const { admin, target } = await setup("tsopen");
    await suspend(target.username, { adminPassword: admin.password }, admin.jar);

    expect((await get("/api/users/me", target.jar)).status).toBe(403);
    expect((await profileOf(target.username)).suspendedUntil).toBeNull();
  });

  it("rejects durations outside 1 to 365 days", async () => {
    const { admin, target } = await setup("tsbad");
    expect((await suspend(target.username, { durationDays: 0, adminPassword: admin.password }, admin.jar)).status).toBe(400);
    expect((await suspend(target.username, { durationDays: 400, adminPassword: admin.password }, admin.jar)).status).toBe(400);
  });
});
