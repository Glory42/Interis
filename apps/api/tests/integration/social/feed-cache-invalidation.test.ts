import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { and, eq } from "drizzle-orm";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestMovie } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import { user } from "../../../src/infrastructure/database/auth.entity";
import { activities } from "../../../src/modules/social/social.entity";

// Review activities are recorded fire-and-forget, so give the insert a
// moment to land before reading the feed.
const waitForActivityWrite = () => new Promise((resolve) => setTimeout(resolve, 150));

// Every test reads a feed first so it is cached, makes a change, then reads
// again inside the 20s cache window: the change must clear the cache.
describe("feed caches are cleared when the feed changes (#84)", () => {
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

  const send = async (jar: CookieJar | undefined, method: string, path: string, body?: unknown) => {
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

  const publicActivity = async (username: string) =>
    JSON.stringify(await send(undefined, "GET", `/api/public/${username}/activity`));

  it("drops a removed follower's view of the account", async () => {
    const author = await signUpTestUser(getServer().baseUrl, "fcirema");
    const other = await signUpTestUser(getServer().baseUrl, "fciremo");
    const fan = await signUpTestUser(getServer().baseUrl, "fciremf");
    await send(author.jar, "POST", `/api/social/follow/${other.username}`);
    await send(fan.jar, "POST", `/api/social/follow/${author.username}`);
    // A follow with no feed row of its own (made before follows were
    // recorded, or the row was lost), so retracting it clears nothing.
    const [fanRow] = await db.select({ id: user.id }).from(user).where(eq(user.username, fan.username));
    await db
      .delete(activities)
      .where(and(eq(activities.userId, fanRow!.id), eq(activities.type, "followed_user")));
    expect(JSON.stringify(await send(fan.jar, "GET", "/api/social/feed"))).toContain(other.username);

    await send(author.jar, "DELETE", `/api/social/follower/${fan.username}`);
    expect(JSON.stringify(await send(fan.jar, "GET", "/api/social/feed"))).not.toContain(
      other.username,
    );
  });

  it("shows new activity on the public activity view", async () => {
    const author = await signUpTestUser(getServer().baseUrl, "fcinewa");
    const other = await signUpTestUser(getServer().baseUrl, "fcinewo");
    expect(await publicActivity(author.username)).not.toContain(other.username);

    await send(author.jar, "POST", `/api/social/follow/${other.username}`);
    expect(await publicActivity(author.username)).toContain(other.username);
  });

  it("shows an edited review on the public activity view", async () => {
    const author = await signUpTestUser(getServer().baseUrl, "fciedta");
    const movie = await seedTestMovie();
    const created = (await send(author.jar, "POST", "/api/reviews", {
      tmdbId: movie.tmdbId,
      content: "First draft",
    })) as { review: { id: string } };
    await waitForActivityWrite();
    expect(await publicActivity(author.username)).toContain("First draft");

    await send(author.jar, "PUT", `/api/reviews/${created.review.id}`, { content: "Second draft" });
    const activity = await publicActivity(author.username);
    expect(activity).toContain("Second draft");
    expect(activity).not.toContain("First draft");
  });
});
