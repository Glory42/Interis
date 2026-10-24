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

type NotificationItem = { type: string; entityId: string };

describe("undoing a follow or like takes its notification back (#80)", () => {
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

  const notificationsOf = async (jar: CookieJar, type: string) =>
    ((await send(jar, "GET", "/api/notifications")) as { items: NotificationItem[] }).items.filter(
      (item) => item.type === type,
    );

  // Turn the action on, off, on again: one notification. Then off: none.
  const toggle = async (on: () => Promise<unknown>, off: () => Promise<unknown>) => {
    await on();
    await off();
    await on();
  };

  it("follow", async () => {
    const target = await signUpTestUser(getServer().baseUrl, "ntgfa");
    const fan = await signUpTestUser(getServer().baseUrl, "ntgff");
    const path = `/api/social/follow/${target.username}`;

    await toggle(
      () => send(fan.jar, "POST", path),
      () => send(fan.jar, "DELETE", path),
    );
    expect(await notificationsOf(target.jar, "follow")).toHaveLength(1);

    await send(fan.jar, "DELETE", path);
    expect(await notificationsOf(target.jar, "follow")).toHaveLength(0);
  });

  it("follow removed by the person followed", async () => {
    const target = await signUpTestUser(getServer().baseUrl, "ntgra");
    const fan = await signUpTestUser(getServer().baseUrl, "ntgrf");

    await send(fan.jar, "POST", `/api/social/follow/${target.username}`);
    await send(target.jar, "DELETE", `/api/social/follower/${fan.username}`);
    expect(await notificationsOf(target.jar, "follow")).toHaveLength(0);
  });

  it("review like", async () => {
    const author = await signUpTestUser(getServer().baseUrl, "ntgva");
    const fan = await signUpTestUser(getServer().baseUrl, "ntgvf");
    const movie = await seedTestMovie();
    const created = (await send(author.jar, "POST", "/api/reviews", {
      tmdbId: movie.tmdbId,
      content: "Toggle me",
    })) as { review: { id: string } };
    const path = `/api/reviews/${created.review.id}/like`;

    await toggle(
      () => send(fan.jar, "POST", path),
      () => send(fan.jar, "DELETE", path),
    );
    expect(await notificationsOf(author.jar, "like_review")).toHaveLength(1);

    await send(fan.jar, "DELETE", path);
    expect(await notificationsOf(author.jar, "like_review")).toHaveLength(0);
  });

  it("post like", async () => {
    const author = await signUpTestUser(getServer().baseUrl, "ntgpa");
    const fan = await signUpTestUser(getServer().baseUrl, "ntgpf");
    const postId = ((await send(author.jar, "POST", "/api/posts", { content: "Toggle" })) as {
      id: string;
    }).id;
    const path = `/api/posts/${postId}/like`;

    await toggle(
      () => send(fan.jar, "POST", path),
      () => send(fan.jar, "DELETE", path),
    );
    expect(await notificationsOf(author.jar, "like_post")).toHaveLength(1);

    await send(fan.jar, "DELETE", path);
    expect(await notificationsOf(author.jar, "like_post")).toHaveLength(0);
  });

  it("activity like, including a repeated like", async () => {
    const author = await signUpTestUser(getServer().baseUrl, "ntgaa");
    const fan = await signUpTestUser(getServer().baseUrl, "ntgaf");

    // The author's follow gives them an activity for the fan to like.
    await send(author.jar, "POST", `/api/social/follow/${fan.username}`);
    const [authorRow] = await db.select({ id: user.id }).from(user).where(eq(user.username, author.username));
    const [activity] = await db
      .select({ id: activities.id })
      .from(activities)
      .where(and(eq(activities.userId, authorRow!.id), eq(activities.type, "followed_user")));
    const path = `/api/social/activities/${activity!.id}/like`;

    await send(fan.jar, "POST", path);
    await toggle(
      () => send(fan.jar, "POST", path),
      () => send(fan.jar, "DELETE", path),
    );
    expect(await notificationsOf(author.jar, "like_activity")).toHaveLength(1);

    await send(fan.jar, "DELETE", path);
    expect(await notificationsOf(author.jar, "like_activity")).toHaveLength(0);
  });
});
