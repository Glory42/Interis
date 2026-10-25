import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestMovie } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import { diaryEntries } from "../../../src/modules/diary/diary.entity";

// Diary activities are recorded fire-and-forget, so give the insert a
// moment to land before reading the stats.
const waitForActivityWrite = () => new Promise((resolve) => setTimeout(resolve, 150));

type NetworkStats = { logsToday: number; liveReviews: number };

// Other tests also log and review today, so every check compares against a
// count read at the start of the test.
describe("today's network stats count live content only (#83)", () => {
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

  const stats = async (): Promise<NetworkStats> => {
    const { logsToday, liveReviews } = (await send(
      undefined,
      "GET",
      "/api/users/stats/network",
    )) as NetworkStats;
    return { logsToday, liveReviews };
  };

  const logMovie = async (jar: CookieJar, review?: string) => {
    const movie = await seedTestMovie();
    const logged = (await send(jar, "POST", "/api/diary", {
      tmdbId: movie.tmdbId,
      watchedDate: "2026-01-01",
      review,
    })) as { entry: { id: string }; review: { id: string } | null };
    await waitForActivityWrite();
    return logged;
  };

  it("stops counting a log's review once the review is deleted", async () => {
    const author = await signUpTestUser(getServer().baseUrl, "nstrev");
    const before = await stats();

    const logged = await logMovie(author.jar, "Worth it");
    expect(await stats()).toEqual({
      logsToday: before.logsToday + 1,
      liveReviews: before.liveReviews + 1,
    });

    await send(author.jar, "DELETE", `/api/reviews/${logged.review!.id}`);
    expect(await stats()).toEqual({
      logsToday: before.logsToday + 1,
      liveReviews: before.liveReviews,
    });

    await send(author.jar, "DELETE", `/api/diary/${logged.entry.id}`);
    expect(await stats()).toEqual(before);
  });

  it("ignores a feed row that outlived its log", async () => {
    const author = await signUpTestUser(getServer().baseUrl, "nstold");
    const before = await stats();
    const logged = await logMovie(author.jar);

    // Rows left behind before deletes retracted them.
    await db.delete(diaryEntries).where(eq(diaryEntries.id, logged.entry.id));
    expect(await stats()).toEqual(before);
  });
});
