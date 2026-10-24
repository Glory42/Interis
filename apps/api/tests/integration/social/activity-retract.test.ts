import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { and, eq } from "drizzle-orm";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestMovie, seedTestSerial } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import { user } from "../../../src/infrastructure/database/auth.entity";
import { activities } from "../../../src/modules/social/social.entity";
import type { ActivityType } from "../../../src/modules/social/repositories/social.repository";

// Media activities are recorded fire-and-forget, so give the insert a
// moment to land before undoing it or asserting on it.
const waitForActivityWrite = () => new Promise((resolve) => setTimeout(resolve, 150));

const getUserId = async (username: string): Promise<string> => {
  const [row] = await db.select({ id: user.id }).from(user).where(eq(user.username, username));
  if (!row) throw new Error(`Test user ${username} not found`);
  return row.id;
};

const activityMetadataFor = async (userId: string, type: ActivityType) => {
  const rows = await db
    .select({ metadata: activities.metadata })
    .from(activities)
    .where(and(eq(activities.userId, userId), eq(activities.type, type)));
  return rows.map((row) => JSON.parse(row.metadata ?? "{}") as Record<string, unknown>);
};

describe("undoing an action retracts its feed activity (#76)", () => {
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

  it("removes a movie like and watchlist row when they are undone", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "rtmovie");
    const movie = await seedTestMovie();
    const userId = await getUserId(username);

    await send(jar, "PUT", `/api/interactions/${movie.tmdbId}`, { liked: true, watchlisted: true });
    await waitForActivityWrite();
    expect(await activityMetadataFor(userId, "liked_movie")).toHaveLength(1);
    expect(await activityMetadataFor(userId, "watchlisted_movie")).toHaveLength(1);

    await send(jar, "PUT", `/api/interactions/${movie.tmdbId}`, { liked: false });
    expect(await activityMetadataFor(userId, "liked_movie")).toHaveLength(0);
    expect(await activityMetadataFor(userId, "watchlisted_movie")).toHaveLength(1);

    await send(jar, "PUT", `/api/interactions/${movie.tmdbId}`, { watchlisted: false });
    expect(await activityMetadataFor(userId, "watchlisted_movie")).toHaveLength(0);
  });

  it("resending a movie like or watchlist adds no second row (#79)", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "rtresend");
    const movie = await seedTestMovie();
    const userId = await getUserId(username);
    const path = `/api/interactions/${movie.tmdbId}`;

    await send(jar, "PUT", path, { liked: true, watchlisted: true });
    await send(jar, "PUT", path, { liked: true, watchlisted: true });
    await send(jar, "PUT", path, { liked: true, rating: 7 });
    await waitForActivityWrite();
    expect(await activityMetadataFor(userId, "liked_movie")).toHaveLength(1);
    expect(await activityMetadataFor(userId, "watchlisted_movie")).toHaveLength(1);

    // A real off -> on flip is news again.
    await send(jar, "PUT", path, { liked: false });
    await send(jar, "PUT", path, { liked: true });
    await waitForActivityWrite();
    expect(await activityMetadataFor(userId, "liked_movie")).toHaveLength(1);
  });

  it("unliking one level of a series leaves the other levels' likes and ratings", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "rtseries");
    const serial = await seedTestSerial();
    const userId = await getUserId(username);
    const base = `/api/serials/${serial.tmdbId}`;

    await send(jar, "PUT", `${base}/interaction`, { liked: true });
    await send(jar, "PUT", `${base}/seasons/1/interaction`, { liked: true, rating: 8 });
    await send(jar, "PUT", `${base}/seasons/1/episodes/2/interaction`, { liked: true });
    await waitForActivityWrite();
    expect(await activityMetadataFor(userId, "liked_movie")).toHaveLength(4);

    await send(jar, "PUT", `${base}/seasons/1/interaction`, { liked: false });
    const afterSeasonUnlike = await activityMetadataFor(userId, "liked_movie");
    expect(afterSeasonUnlike).toHaveLength(3);
    // The season's rating row survives its like being undone.
    expect(afterSeasonUnlike).toContainEqual(expect.objectContaining({ seasonNumber: 1, rating: 8 }));
    expect(afterSeasonUnlike).toContainEqual(
      expect.objectContaining({ seasonNumber: 1, episodeNumber: 2 }),
    );

    await send(jar, "PUT", `${base}/seasons/1/interaction`, { rating: null });
    await send(jar, "PUT", `${base}/interaction`, { liked: false });
    const remaining = await activityMetadataFor(userId, "liked_movie");
    expect(remaining).toHaveLength(1);
    expect(remaining[0]).toMatchObject({ seasonNumber: 1, episodeNumber: 2 });

    await send(jar, "PUT", `${base}/seasons/1/episodes/2/interaction`, { liked: false });
    expect(await activityMetadataFor(userId, "liked_movie")).toHaveLength(0);
  });

  it("removes a series watchlist row when it is undone", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "rtserieswl");
    const serial = await seedTestSerial();
    const userId = await getUserId(username);

    await send(jar, "PUT", `/api/serials/${serial.tmdbId}/interaction`, { watchlisted: true });
    await waitForActivityWrite();
    expect(await activityMetadataFor(userId, "watchlisted_movie")).toHaveLength(1);

    await send(jar, "PUT", `/api/serials/${serial.tmdbId}/interaction`, { watchlisted: false });
    expect(await activityMetadataFor(userId, "watchlisted_movie")).toHaveLength(0);
  });

  it("removes the follow row on unfollow, and it leaves the feed", async () => {
    const follower = await signUpTestUser(getServer().baseUrl, "rtfollower");
    const target = await signUpTestUser(getServer().baseUrl, "rttarget");
    const followerId = await getUserId(follower.username);

    await send(follower.jar, "POST", `/api/social/follow/${target.username}`);
    expect(await activityMetadataFor(followerId, "followed_user")).toHaveLength(1);

    await send(follower.jar, "DELETE", `/api/social/follow/${target.username}`);
    expect(await activityMetadataFor(followerId, "followed_user")).toHaveLength(0);

    const feed = (await send(follower.jar, "GET", "/api/social/feed")) as {
      items: Array<{ type: string }>;
    };
    expect(feed.items.map((item) => item.type)).not.toContain("followed_user");
  });

  it("removes a review like and a post like when they are undone", async () => {
    const author = await signUpTestUser(getServer().baseUrl, "rtauthor");
    const fan = await signUpTestUser(getServer().baseUrl, "rtfan");
    const fanId = await getUserId(fan.username);
    const movie = await seedTestMovie();

    const logged = (await send(author.jar, "POST", "/api/diary", {
      tmdbId: movie.tmdbId,
      watchedDate: "2026-01-01",
      review: "Worth a like",
    })) as { review: { id: string } };
    const reviewId = logged.review.id;
    const postId = ((await send(author.jar, "POST", "/api/posts", { content: "Like me" })) as {
      id: string;
    }).id;

    await send(fan.jar, "POST", `/api/reviews/${reviewId}/like`);
    await send(fan.jar, "POST", `/api/posts/${postId}/like`);
    // Commenting on the post is a `commented` row too; unliking must keep it.
    await send(fan.jar, "POST", `/api/posts/${postId}/comments`, { content: "Nice" });
    expect(await activityMetadataFor(fanId, "liked_review")).toHaveLength(1);
    expect(await activityMetadataFor(fanId, "commented")).toHaveLength(2);

    await send(fan.jar, "DELETE", `/api/reviews/${reviewId}/like`);
    await send(fan.jar, "DELETE", `/api/posts/${postId}/like`);
    expect(await activityMetadataFor(fanId, "liked_review")).toHaveLength(0);
    const commented = await activityMetadataFor(fanId, "commented");
    expect(commented).toHaveLength(1);
    expect(commented[0]).toMatchObject({ action: "commented_post" });
  });
});
