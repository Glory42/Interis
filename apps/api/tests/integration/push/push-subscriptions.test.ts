import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import { user } from "../../../src/infrastructure/database/auth.entity";
import { pushSubscriptions } from "../../../src/modules/push/push.entity";
import { MAX_SUBSCRIPTIONS_PER_USER } from "../../../src/modules/push/constants/push.constants";
import { installFakePush, makeSubscription, sendJson, signUpWithId } from "./push-test-helpers";

describe("push subscriptions", () => {
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

  const subscriptionsOf = (userId: string) =>
    db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));

  it("hands out the VAPID public key without auth", async () => {
    const response = await sendJson(server.baseUrl, undefined, "GET", "/api/push/public-key");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ enabled: true, publicKey: fake.publicKey });
  });

  it("requires sign-in to subscribe", async () => {
    const response = await sendJson(server.baseUrl, undefined, "POST", "/api/push/subscriptions", makeSubscription());
    expect(response.status).toBe(401);
  });

  it("upserts by endpoint and unsubscribes", async () => {
    const me = await signUpWithId(server.baseUrl, "pshsub");
    const subscription = makeSubscription();

    for (let i = 0; i < 2; i += 1) {
      const response = await sendJson(server.baseUrl, me.jar, "POST", "/api/push/subscriptions", subscription);
      expect(response.status).toBe(200);
    }
    expect(await subscriptionsOf(me.userId)).toHaveLength(1);

    const removed = await sendJson(server.baseUrl, me.jar, "DELETE", "/api/push/subscriptions", {
      endpoint: subscription.endpoint,
    });
    expect(removed.status).toBe(200);
    expect(await subscriptionsOf(me.userId)).toHaveLength(0);
  });

  it("moves a browser's subscription to whoever signs in there next", async () => {
    const first = await signUpWithId(server.baseUrl, "pshmva");
    const second = await signUpWithId(server.baseUrl, "pshmvb");
    const subscription = makeSubscription();

    await sendJson(server.baseUrl, first.jar, "POST", "/api/push/subscriptions", subscription);
    await sendJson(server.baseUrl, second.jar, "POST", "/api/push/subscriptions", subscription);

    expect(await subscriptionsOf(first.userId)).toHaveLength(0);
    expect(await subscriptionsOf(second.userId)).toHaveLength(1);
  });

  it("won't let one user remove another's subscription", async () => {
    const owner = await signUpWithId(server.baseUrl, "pshowa");
    const other = await signUpWithId(server.baseUrl, "pshowb");
    const subscription = makeSubscription();

    await sendJson(server.baseUrl, owner.jar, "POST", "/api/push/subscriptions", subscription);
    await sendJson(server.baseUrl, other.jar, "DELETE", "/api/push/subscriptions", { endpoint: subscription.endpoint });

    expect(await subscriptionsOf(owner.userId)).toHaveLength(1);
  });

  it(`keeps at most ${MAX_SUBSCRIPTIONS_PER_USER} per user, dropping the oldest`, async () => {
    const me = await signUpWithId(server.baseUrl, "pshcap");
    const endpoints: string[] = [];

    for (let i = 0; i < MAX_SUBSCRIPTIONS_PER_USER + 2; i += 1) {
      const subscription = makeSubscription();
      endpoints.push(subscription.endpoint);
      await sendJson(server.baseUrl, me.jar, "POST", "/api/push/subscriptions", subscription);
    }

    const kept = (await subscriptionsOf(me.userId)).map((row) => row.endpoint).sort();
    expect(kept).toEqual(endpoints.slice(2).sort());
  });

  it("rejects endpoints outside the known push services and malformed keys", async () => {
    const me = await signUpWithId(server.baseUrl, "pshbad");
    const valid = makeSubscription();

    const cases = [
      { ...valid, endpoint: "https://internal.example.com/push" },
      { ...valid, endpoint: "http://fcm.googleapis.com/fcm/send/x" },
      { ...valid, endpoint: "https://fcm.googleapis.com.evil.test/x" },
      { ...valid, keys: { ...valid.keys, p256dh: "abc" } },
      { ...valid, keys: { ...valid.keys, auth: valid.keys.p256dh } },
    ];
    for (const body of cases) {
      const response = await sendJson(server.baseUrl, me.jar, "POST", "/api/push/subscriptions", body);
      expect(response.status).toBe(400);
    }
    expect(await subscriptionsOf(me.userId)).toHaveLength(0);
  });

  it("goes away with the user", async () => {
    const me = await signUpWithId(server.baseUrl, "pshdel");
    await sendJson(server.baseUrl, me.jar, "POST", "/api/push/subscriptions", makeSubscription());

    await db.delete(user).where(eq(user.id, me.userId));
    expect(await subscriptionsOf(me.userId)).toHaveLength(0);
  });
});

describe("push preferences", () => {
  let server: RunningTestServer;

  beforeAll(async () => {
    server = await startTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it("defaults to every category on and saves partial changes", async () => {
    const me = await signUpWithId(server.baseUrl, "pshprf");

    const initial = await sendJson(server.baseUrl, me.jar, "GET", "/api/push/preferences");
    expect(await initial.json()).toEqual({ follows: true, likes: true, comments: true, moderation: true });

    const updated = await sendJson(server.baseUrl, me.jar, "PUT", "/api/push/preferences", { likes: false });
    expect(await updated.json()).toEqual({ follows: true, likes: false, comments: true, moderation: true });

    const again = await sendJson(server.baseUrl, me.jar, "PUT", "/api/push/preferences", { follows: false });
    expect(await again.json()).toEqual({ follows: false, likes: false, comments: true, moderation: true });
  });

  it("rejects unknown or empty changes", async () => {
    const me = await signUpWithId(server.baseUrl, "pshprx");
    for (const body of [{}, { likes: "no" }, { birthdays: true }]) {
      const response = await sendJson(server.baseUrl, me.jar, "PUT", "/api/push/preferences", body);
      expect(response.status).toBe(400);
    }
  });
});

describe("push when VAPID keys are unset", () => {
  let server: RunningTestServer;

  beforeAll(async () => {
    server = await startTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it("says it's disabled and refuses subscriptions", async () => {
    const keyResponse = await sendJson(server.baseUrl, undefined, "GET", "/api/push/public-key");
    expect(await keyResponse.json()).toEqual({ enabled: false, publicKey: null });

    const me = await signUpWithId(server.baseUrl, "pshoff");
    const response = await sendJson(server.baseUrl, me.jar, "POST", "/api/push/subscriptions", makeSubscription());
    expect(response.status).toBe(503);
  });
});
