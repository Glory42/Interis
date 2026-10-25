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

// Likes are recorded fire-and-forget, so give the insert a moment to land.
const waitForActivityWrite = () => new Promise((resolve) => setTimeout(resolve, 150));

// Marking a liked or rated movie not watched keeps the like and rating
// unless the same request clears them too (#93).
describe("marking a liked, rated movie not watched", () => {
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

  const put = async (jar: CookieJar, tmdbId: number, body: unknown) => {
    const response = await apiRequest(
      getServer().baseUrl,
      `/api/interactions/${tmdbId}`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
      jar,
    );
    expect(response.status).toBe(200);
    return response.json();
  };

  const likeRows = async (username: string) => {
    const [row] = await db.select({ id: user.id }).from(user).where(eq(user.username, username));
    return db
      .select({ id: activities.id })
      .from(activities)
      .where(and(eq(activities.userId, row!.id), eq(activities.type, "liked_movie")));
  };

  const likeAndRate = async (prefix: string) => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, prefix);
    const movie = await seedTestMovie();
    await put(jar, movie.tmdbId, { liked: true, rating: 8 });
    await waitForActivityWrite();
    return { jar, username, tmdbId: movie.tmdbId };
  };

  it("keeps the like and rating when only watched is sent", async () => {
    const { jar, username, tmdbId } = await likeAndRate("uclkeep");

    expect(await put(jar, tmdbId, { watched: false })).toEqual({
      liked: true,
      watchlisted: false,
      rating: 8,
      watched: false,
    });
    expect(await likeRows(username)).toHaveLength(1);
  });

  it("clears the like and rating sent alongside, and takes the like off the feed", async () => {
    const { jar, username, tmdbId } = await likeAndRate("uclclear");

    expect(await put(jar, tmdbId, { watched: false, liked: false, rating: null })).toEqual({
      liked: false,
      watchlisted: false,
      rating: null,
      watched: false,
    });
    expect(await likeRows(username)).toHaveLength(0);
  });
});
