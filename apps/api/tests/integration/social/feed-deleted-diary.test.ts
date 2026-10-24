import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { and, eq } from "drizzle-orm";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestMovie, seedTestSerial } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import { user } from "../../../src/infrastructure/database/auth.entity";
import { diaryEntries } from "../../../src/modules/diary/diary.entity";
import { activities } from "../../../src/modules/social/social.entity";

// Media activities are recorded fire-and-forget, so give the insert a
// moment to land before asserting on it.
const waitForActivityWrite = () => new Promise((resolve) => setTimeout(resolve, 150));

type FeedItem = {
  type: string;
  metadata: { rating: number | null; rewatch: boolean | null };
};

const countDiaryActivities = async (username: string) => {
  const [author] = await db.select({ id: user.id }).from(user).where(eq(user.username, username));
  if (!author) throw new Error(`Test user ${username} not found`);
  const rows = await db
    .select({ id: activities.id })
    .from(activities)
    .where(and(eq(activities.userId, author.id), eq(activities.type, "diary_entry")));
  return rows.length;
};

describe("deleted and edited diary logs in the feed (#82)", () => {
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

  const getDiaryItems = async (jar: CookieJar) =>
    ((await send(jar, "GET", "/api/social/feed")) as { items: FeedItem[] }).items.filter(
      (item) => item.type === "diary_entry",
    );

  // Follower and author, with the follower's feed not fetched yet so the
  // 20s feed cache can't hide what the change did.
  const signUpPair = async (prefix: string) => {
    const author = await signUpTestUser(getServer().baseUrl, `${prefix}a`);
    const fan = await signUpTestUser(getServer().baseUrl, `${prefix}f`);
    await send(fan.jar, "POST", `/api/social/follow/${author.username}`);
    return { author, fan };
  };

  const logMovie = async (jar: CookieJar) => {
    const movie = await seedTestMovie();
    const logged = (await send(jar, "POST", "/api/diary", {
      tmdbId: movie.tmdbId,
      watchedDate: "2026-01-01",
      rating: 3,
    })) as { entry: { id: string } };
    await waitForActivityWrite();
    return logged.entry.id;
  };

  it("drops a deleted movie log", async () => {
    const { author, fan } = await signUpPair("fdlogm");
    const entryId = await logMovie(author.jar);
    expect(await countDiaryActivities(author.username)).toBe(1);

    await send(author.jar, "DELETE", `/api/diary/${entryId}`);
    expect(await countDiaryActivities(author.username)).toBe(0);
    expect(await getDiaryItems(fan.jar)).toHaveLength(0);
  });

  it("drops a deleted series log", async () => {
    const { author, fan } = await signUpPair("fdlogs");
    const serial = await seedTestSerial();
    const logged = (await send(author.jar, "POST", `/api/serials/${serial.tmdbId}/log`, {
      watchedDate: "2026-01-01",
    })) as { entry: { id: string } };
    await waitForActivityWrite();
    expect(await countDiaryActivities(author.username)).toBe(1);

    await send(author.jar, "DELETE", `/api/serials/logs/${logged.entry.id}`);
    expect(await countDiaryActivities(author.username)).toBe(0);
    expect(await getDiaryItems(fan.jar)).toHaveLength(0);
  });

  it("hides a log whose feed row outlived it", async () => {
    const { author, fan } = await signUpPair("fdlogo");
    const entryId = await logMovie(author.jar);

    // Rows left behind before deletes retracted them.
    await db.delete(diaryEntries).where(eq(diaryEntries.id, entryId));
    expect(await countDiaryActivities(author.username)).toBe(1);
    expect(await getDiaryItems(fan.jar)).toHaveLength(0);
  });

  it("shows an edited log's current rating, including to its author", async () => {
    const { author, fan } = await signUpPair("fdloge");
    const entryId = await logMovie(author.jar);
    expect((await getDiaryItems(author.jar))[0]?.metadata.rating).toBe(3);

    await send(author.jar, "PUT", `/api/diary/${entryId}`, { rating: 4.5, rewatch: true });

    // The author's feed was cached by the read above; the edit must clear it.
    for (const jar of [author.jar, fan.jar]) {
      expect((await getDiaryItems(jar))[0]?.metadata).toMatchObject({ rating: 4.5, rewatch: true });
    }
  });
});
