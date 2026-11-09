import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser, type SignedUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

type NotificationPage = { items: { id: string; type: string }[] };

describe("notification deletion", () => {
  let testServer: RunningTestServer | null = null;

  const getServer = (): RunningTestServer => {
    if (!testServer) {
      throw new Error("Test server is not running");
    }
    return testServer;
  };

  const follow = (actor: SignedUpTestUser, target: SignedUpTestUser) =>
    apiRequest(
      getServer().baseUrl,
      `/api/social/follow/${target.username}`,
      { method: "POST" },
      actor.jar,
    );

  const listNotifications = async (jar: CookieJar): Promise<NotificationPage> => {
    const response = await apiRequest(getServer().baseUrl, "/api/notifications", {}, jar);
    return (await response.json()) as NotificationPage;
  };

  const unreadCount = async (jar: CookieJar): Promise<number> => {
    const response = await apiRequest(
      getServer().baseUrl,
      "/api/notifications/unread-count",
      {},
      jar,
    );
    return ((await response.json()) as { count: number }).count;
  };

  beforeAll(async () => {
    testServer = await startTestServer();
  });

  afterAll(async () => {
    if (!testServer) return;
    await testServer.close();
    testServer = null;
  });

  it("requires auth", async () => {
    const one = await apiRequest(
      getServer().baseUrl,
      "/api/notifications/00000000-0000-4000-8000-000000000000",
      { method: "DELETE" },
    );
    const all = await apiRequest(getServer().baseUrl, "/api/notifications", {
      method: "DELETE",
    });
    expect(one.status).toBe(401);
    expect(all.status).toBe(401);
  });

  it("deletes one of the recipient's own notifications", async () => {
    const recipient = await signUpTestUser(getServer().baseUrl, "ndrecip");
    const actorA = await signUpTestUser(getServer().baseUrl, "ndacta");
    const actorB = await signUpTestUser(getServer().baseUrl, "ndactb");
    await follow(actorA, recipient);
    await follow(actorB, recipient);

    const before = await listNotifications(recipient.jar);
    expect(before.items).toHaveLength(2);
    expect(await unreadCount(recipient.jar)).toBe(2);
    const [target, kept] = before.items;

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/notifications/${target!.id}`,
      { method: "DELETE" },
      recipient.jar,
    );
    expect(response.status).toBe(200);

    const after = await listNotifications(recipient.jar);
    expect(after.items.map((item) => item.id)).toEqual([kept!.id]);
    expect(await unreadCount(recipient.jar)).toBe(1);

    const again = await apiRequest(
      getServer().baseUrl,
      `/api/notifications/${target!.id}`,
      { method: "DELETE" },
      recipient.jar,
    );
    expect(again.status).toBe(404);
  });

  it("cannot delete someone else's notification", async () => {
    const recipient = await signUpTestUser(getServer().baseUrl, "ndowner");
    const actor = await signUpTestUser(getServer().baseUrl, "ndactor");
    const intruder = await signUpTestUser(getServer().baseUrl, "ndintruder");
    await follow(actor, recipient);

    const [notification] = (await listNotifications(recipient.jar)).items;
    const response = await apiRequest(
      getServer().baseUrl,
      `/api/notifications/${notification!.id}`,
      { method: "DELETE" },
      intruder.jar,
    );
    expect(response.status).toBe(404);
    expect((await listNotifications(recipient.jar)).items).toHaveLength(1);
  });

  it("rejects a malformed id", async () => {
    const viewer = await signUpTestUser(getServer().baseUrl, "ndbadid");
    const response = await apiRequest(
      getServer().baseUrl,
      "/api/notifications/not-a-uuid",
      { method: "DELETE" },
      viewer.jar,
    );
    expect(response.status).toBe(400);
  });

  it("clears all of the viewer's notifications and nobody else's", async () => {
    const recipient = await signUpTestUser(getServer().baseUrl, "ndclear");
    const bystander = await signUpTestUser(getServer().baseUrl, "ndbystand");
    const actorA = await signUpTestUser(getServer().baseUrl, "ndclra");
    const actorB = await signUpTestUser(getServer().baseUrl, "ndclrb");
    await follow(actorA, recipient);
    await follow(actorB, recipient);
    await follow(actorA, bystander);

    const response = await apiRequest(
      getServer().baseUrl,
      "/api/notifications",
      { method: "DELETE" },
      recipient.jar,
    );
    expect(response.status).toBe(200);

    expect((await listNotifications(recipient.jar)).items).toHaveLength(0);
    expect(await unreadCount(recipient.jar)).toBe(0);
    expect((await listNotifications(bystander.jar)).items).toHaveLength(1);
  });
});
