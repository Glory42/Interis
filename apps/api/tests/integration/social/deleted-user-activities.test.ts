import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { and, eq } from "drizzle-orm";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import { user } from "../../../src/infrastructure/database/auth.entity";
import { activities } from "../../../src/modules/social/social.entity";

// "X followed Y" rows belong to X, so deleting Y's account doesn't cascade
// them. Deleting the account removes them, and feeds drop any left behind
// from before (#102).
describe("activities about a deleted account", () => {
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

  const send = async (jar: CookieJar | undefined, method: string, path: string) => {
    const response = await apiRequest(getServer().baseUrl, path, { method }, jar);
    expect(response.status).toBeLessThan(300);
    return JSON.stringify(await response.json().catch(() => null));
  };

  const userId = async (username: string) => {
    const [row] = await db.select({ id: user.id }).from(user).where(eq(user.username, username));
    return row!.id;
  };

  const followRowsAbout = async (targetId: string) =>
    db
      .select({ id: activities.id })
      .from(activities)
      .where(and(eq(activities.type, "followed_user"), eq(activities.entityId, targetId)));

  it("removes follows of the account from the database and every feed", async () => {
    const author = await signUpTestUser(getServer().baseUrl, "duafollow");
    const gone = await signUpTestUser(getServer().baseUrl, "duagone");
    const fan = await signUpTestUser(getServer().baseUrl, "duafan");
    const goneId = await userId(gone.username);
    await send(author.jar, "POST", `/api/social/follow/${gone.username}`);
    await send(fan.jar, "POST", `/api/social/follow/${author.username}`);

    // The author's public view is read first so it is cached. Other users'
    // following feeds keep their short TTL, as for every other retraction.
    expect(await send(undefined, "GET", `/api/public/${author.username}/activity`)).toContain(
      gone.username,
    );

    await send(gone.jar, "DELETE", "/api/auth/account");

    expect(await followRowsAbout(goneId)).toHaveLength(0);
    expect(await send(fan.jar, "GET", "/api/social/feed")).not.toContain(gone.username);
    expect(await send(undefined, "GET", `/api/public/${author.username}/activity`)).not.toContain(
      gone.username,
    );
  });

  it("drops a follow left behind by an earlier deletion", async () => {
    const author = await signUpTestUser(getServer().baseUrl, "dualeft");
    const gone = await signUpTestUser(getServer().baseUrl, "dualeftgone");
    await send(author.jar, "POST", `/api/social/follow/${gone.username}`);

    // Deleted straight from the table, as before deletes cleaned up.
    await db.delete(user).where(eq(user.id, await userId(gone.username)));

    expect(await send(undefined, "GET", `/api/public/${author.username}/activity`)).not.toContain(
      gone.username,
    );
  });
});
