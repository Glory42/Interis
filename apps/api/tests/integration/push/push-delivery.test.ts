import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { seedTestFilm } from "../../support/factories/media.factory";
import { db } from "../../../src/infrastructure/database/db";
import { pushSubscriptions } from "../../../src/modules/push/push.entity";
import { PushService } from "../../../src/modules/push/push.service";
import { MAX_DELIVERY_FAILURES } from "../../../src/modules/push/constants/push.constants";
import { installFakePush, makeSubscription, sendJson, signUpWithId } from "./push-test-helpers";

describe("notifications go out as Web Push", () => {
  let server: RunningTestServer;
  let fake: ReturnType<typeof installFakePush>;

  beforeAll(async () => {
    server = await startTestServer();
    fake = installFakePush();
  });

  afterAll(async () => {
    fake.restore();
    await server.close();
  });

  const subscribedUser = async (prefix: string, devices = 1) => {
    const signedUp = await signUpWithId(server.baseUrl, prefix);
    const subscriptions = Array.from({ length: devices }, () => makeSubscription());
    for (const subscription of subscriptions) {
      const response = await sendJson(server.baseUrl, signedUp.jar, "POST", "/api/push/subscriptions", subscription);
      expect(response.status).toBe(200);
    }
    return { ...signedUp, endpoints: subscriptions.map((subscription) => subscription.endpoint) };
  };

  const pushesTo = (endpoints: string[]) => fake.sent.filter((push) => endpoints.includes(push.target.endpoint));

  const follow = async (jar: Parameters<typeof sendJson>[1], username: string) => {
    const response = await sendJson(server.baseUrl, jar, "POST", `/api/social/follow/${username}`);
    expect(response.status).toBeLessThan(300);
    await PushService.whenIdle();
  };

  const subscriptionRows = (userId: string) =>
    db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));

  it("sends once per subscription with a small public payload", async () => {
    const target = await subscribedUser("pshdla", 2);
    const fan = await signUpWithId(server.baseUrl, "pshdlb");

    await follow(fan.jar, target.username);

    const pushes = pushesTo(target.endpoints);
    expect(pushes).toHaveLength(2);
    expect(new Set(pushes.map((push) => push.target.endpoint))).toEqual(new Set(target.endpoints));
    expect(pushes[0]?.payload).toEqual({
      title: "Interis",
      body: `@${fan.username} started following you`,
      url: `/profile/${fan.username}`,
      tag: `follow:${fan.userId}`,
    });
  });

  it("links review likes to the review and never carries comment text", async () => {
    const author = await subscribedUser("pshrva");
    const fan = await signUpWithId(server.baseUrl, "pshrvb");
    const movie = await seedTestFilm();
    const created = await sendJson(server.baseUrl, author.jar, "POST", "/api/reviews", {
      tmdbId: movie.tmdbId,
      content: "Push me",
    });
    const reviewId = ((await created.json()) as { review: { id: string } }).review.id;

    await sendJson(server.baseUrl, fan.jar, "POST", `/api/reviews/${reviewId}/like`);
    await sendJson(server.baseUrl, fan.jar, "POST", `/api/reviews/${reviewId}/comments`, {
      content: "a secret only the page should show",
    });
    await PushService.whenIdle();

    const payloads = pushesTo(author.endpoints).map((push) => push.payload);
    expect(payloads.map((payload) => payload.body)).toEqual([
      `@${fan.username} liked your review`,
      `@${fan.username} commented on your review`,
    ]);
    for (const payload of payloads) {
      expect(payload.url).toBe(`/reviews/${author.username}/${reviewId}`);
      expect(JSON.stringify(payload)).not.toContain("secret");
    }
  });

  it("skips categories the recipient turned off", async () => {
    const author = await subscribedUser("pshpfa");
    const fan = await signUpWithId(server.baseUrl, "pshpfb");
    await sendJson(server.baseUrl, author.jar, "PUT", "/api/push/preferences", { likes: false });
    const postResponse = await sendJson(server.baseUrl, author.jar, "POST", "/api/posts", { content: "Quiet" });
    const postId = ((await postResponse.json()) as { id: string }).id;

    await sendJson(server.baseUrl, fan.jar, "POST", `/api/posts/${postId}/like`);
    await PushService.whenIdle();
    expect(pushesTo(author.endpoints)).toHaveLength(0);

    await follow(fan.jar, author.username);
    expect(pushesTo(author.endpoints).map((push) => push.payload.tag)).toEqual([`follow:${fan.userId}`]);
  });

  it("deletes subscriptions the push service says are gone", async () => {
    const target = await subscribedUser("pshgna", 3);
    const fan = await signUpWithId(server.baseUrl, "pshgnb");
    const [gone, missing, alive] = target.endpoints as [string, string, string];
    fake.statusByEndpoint.set(gone, 410);
    fake.statusByEndpoint.set(missing, 404);

    await follow(fan.jar, target.username);

    expect((await subscriptionRows(target.userId)).map((row) => row.endpoint)).toEqual([alive]);
  });

  it("never fails the triggering request, and drops a subscription after repeated failures", async () => {
    const target = await subscribedUser("pshfla", 2);
    const fan = await signUpWithId(server.baseUrl, "pshflb");
    const [flaky, broken] = target.endpoints as [string, string];
    fake.statusByEndpoint.set(flaky, "throw");
    fake.statusByEndpoint.set(broken, 500);
    await db
      .update(pushSubscriptions)
      .set({ failureCount: MAX_DELIVERY_FAILURES - 1 })
      .where(eq(pushSubscriptions.endpoint, broken));

    await follow(fan.jar, target.username);

    const notifications = await sendJson(server.baseUrl, target.jar, "GET", "/api/notifications");
    expect(((await notifications.json()) as { items: unknown[] }).items).toHaveLength(1);
    const rows = await subscriptionRows(target.userId);
    expect(rows.map((row) => [row.endpoint, row.failureCount])).toEqual([[flaky, 1]]);
  });

  it("sends nothing when push is unconfigured", async () => {
    const target = await subscribedUser("pshnca");
    const fan = await signUpWithId(server.baseUrl, "pshncb");
    fake.restore();
    try {
      await follow(fan.jar, target.username);
      expect(pushesTo(target.endpoints)).toHaveLength(0);
    } finally {
      fake = installFakePush();
    }
  });
});
