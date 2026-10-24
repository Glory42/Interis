import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { and, eq } from "drizzle-orm";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import { user } from "../../../src/infrastructure/database/auth.entity";
import { activities } from "../../../src/modules/social/social.entity";

type FeedItem = {
  type: string;
  metadata: { listId: string | null; listTitle: string | null };
};

describe("created_list items follow the live list (#81)", () => {
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

  const listItems = async (jar: CookieJar) =>
    ((await send(jar, "GET", "/api/social/feed")) as { items: FeedItem[] }).items.filter(
      (item) => item.type === "created_list",
    );

  const createList = async (jar: CookieJar, title: string, isPublic: boolean) =>
    ((await send(jar, "POST", "/api/lists", { title, isPublic })) as { id: string }).id;

  it("keeps a private list's title out of every feed", async () => {
    const author = await signUpTestUser(getServer().baseUrl, "flpriva");
    const fan = await signUpTestUser(getServer().baseUrl, "flprivf");
    await send(fan.jar, "POST", `/api/social/follow/${author.username}`);

    await createList(author.jar, "Secret guilty pleasures", false);

    for (const response of [
      await send(fan.jar, "GET", "/api/social/feed"),
      await send(author.jar, "GET", "/api/social/feed"),
      await send(undefined, "GET", `/api/public/${author.username}/activity`),
    ]) {
      expect(JSON.stringify(response)).not.toContain("Secret guilty pleasures");
    }
  });

  it("follows renames and visibility changes", async () => {
    const author = await signUpTestUser(getServer().baseUrl, "flrena");
    const listId = await createList(author.jar, "Old title", true);
    expect((await listItems(author.jar))[0]?.metadata).toMatchObject({ listId, listTitle: "Old title" });

    // The author's feed was cached by the read above; the edits must clear it.
    await send(author.jar, "PATCH", `/api/lists/${listId}`, { title: "New title" });
    expect((await listItems(author.jar))[0]?.metadata.listTitle).toBe("New title");

    await send(author.jar, "PATCH", `/api/lists/${listId}`, { isPublic: false });
    expect(await listItems(author.jar)).toHaveLength(0);

    await send(author.jar, "PATCH", `/api/lists/${listId}`, { isPublic: true });
    expect(await listItems(author.jar)).toHaveLength(1);
  });

  it("removes a deleted list's feed row", async () => {
    const author = await signUpTestUser(getServer().baseUrl, "fldela");
    const [authorRow] = await db.select({ id: user.id }).from(user).where(eq(user.username, author.username));
    const listId = await createList(author.jar, "Short-lived", true);

    await send(author.jar, "DELETE", `/api/lists/${listId}`);
    const rows = await db
      .select({ id: activities.id })
      .from(activities)
      .where(and(eq(activities.userId, authorRow!.id), eq(activities.type, "created_list")));
    expect(rows).toHaveLength(0);
    expect(await listItems(author.jar)).toHaveLength(0);
  });
});
