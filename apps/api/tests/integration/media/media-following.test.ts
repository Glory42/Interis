import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestFilm, seedTestSeries } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import { user } from "../../../src/infrastructure/database/auth.entity";
import { diaryEntries } from "../../../src/modules/diary/diary.entity";
import { films } from "../../../src/modules/films/films.entity";
import { filmInteractions } from "../../../src/modules/interactions/interactions.entity";
import { userBlocks, userMutes } from "../../../src/modules/moderation/moderation.entity";
import { reviews } from "../../../src/modules/reviews/reviews.entity";
import { follows } from "../../../src/modules/social/social.entity";
import { seriesDiaryEntries, seriesInteractions, tvSeries } from "../../../src/modules/tv/tv.entity";
import { profiles } from "../../../src/modules/users/users.entity";

type Person = {
  username: string;
  liked: boolean;
  watched: boolean;
  watchStatus: string | null;
  rating: number | null;
  watchedDate: string | null;
  reviewId: string | null;
};

type FollowingBody = {
  summary: { count: number; ratedCount: number; reviewCount: number; averageRating: number | null };
  people: Person[];
  limit: number;
};

type Title = { id: number; tmdbId: number };
type InteractionInput = { liked?: boolean; rating?: number; watched?: boolean; watchStatus?: "watching" | "completed" };

// One case table, run for Films (/api/movies) and Series (/api/serials).
const KINDS = [
  {
    name: "Film",
    mediaType: "movie" as const,
    seed: seedTestFilm,
    base: "/api/movies",
    interact: async (userId: string, title: Title, input: InteractionInput) => {
      await db.insert(filmInteractions).values({
        userId,
        movieId: title.id,
        liked: input.liked ?? false,
        rating: input.rating ?? null,
        isWatched: input.watched ?? input.watchStatus === "completed",
      });
    },
    log: async (userId: string, title: Title, watchedDate: string, rating: number | null) => {
      const [row] = await db
        .insert(diaryEntries)
        .values({ userId, movieId: title.id, watchedDate, rating })
        .returning({ id: diaryEntries.id });
      return row!.id;
    },
  },
  {
    name: "Series",
    mediaType: "tv" as const,
    seed: seedTestSeries,
    base: "/api/serials",
    interact: async (userId: string, title: Title, input: InteractionInput) => {
      await db.insert(seriesInteractions).values({
        userId,
        seriesId: title.id,
        liked: input.liked ?? false,
        rating: input.rating ?? null,
        watchStatus: input.watchStatus ?? (input.watched ? "completed" : null),
      });
    },
    log: async (userId: string, title: Title, watchedDate: string, rating: number | null) => {
      const [row] = await db
        .insert(seriesDiaryEntries)
        .values({ userId, seriesId: title.id, watchedDate, rating })
        .returning({ id: seriesDiaryEntries.id });
      return row!.id;
    },
  },
];

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

const signUp = async (prefix: string) => {
  const { jar, username } = await signUpTestUser(getServer().baseUrl, prefix);
  const [row] = await db.select({ id: user.id }).from(user).where(eq(user.username, username));
  return { jar, username, id: row!.id };
};

const follow = (followerId: string, followingId: string) =>
  db.insert(follows).values({ followerId, followingId });

const readJson = async <T>(jar: CookieJar, path: string): Promise<T> => {
  const response = await apiRequest(getServer().baseUrl, path, {}, jar);
  expect(response.status).toBe(200);
  return (await response.json()) as T;
};

for (const kind of KINDS) describe(`${kind.name}: from people you follow`, () => {
  const review = async (userId: string, title: Title, content: string) => {
    const [row] = await db
      .insert(reviews)
      .values({
        userId,
        mediaType: kind.mediaType,
        mediaSourceId: String(title.tmdbId),
        movieId: kind.mediaType === "movie" ? title.id : null,
        content,
      })
      .returning({ id: reviews.id });
    return row!.id;
  };

  it("requires auth", async () => {
    const title = await kind.seed();
    const response = await apiRequest(getServer().baseUrl, `${kind.base}/${title.tmdbId}/following`);
    expect(response.status).toBe(401);
  });

  it("counts only followed users and averages their Your Rating", async () => {
    const [viewer, rated, logged, stranger, watchlistOnly] = await Promise.all([
      signUp("fv"),
      signUp("fa"),
      signUp("fb"),
      signUp("fc"),
      signUp("fd"),
    ]);
    const title = await kind.seed();
    await Promise.all([
      follow(viewer.id, rated.id),
      follow(viewer.id, logged.id),
      follow(viewer.id, watchlistOnly.id),
    ]);

    await kind.interact(rated.id, title, { liked: true, rating: 8, watched: true });
    await kind.log(rated.id, title, "2026-03-01", 8);
    const reviewId = await review(rated.id, title, "Loved it");
    // No Interaction rating: Your Rating falls back to the latest rated log.
    await kind.log(logged.id, title, "2026-01-10", 6);
    await kind.interact(stranger.id, title, { rating: 10, watched: true });
    await db.insert(kind.mediaType === "movie" ? filmInteractions : seriesInteractions).values({
      userId: watchlistOnly.id,
      ...(kind.mediaType === "movie" ? { movieId: title.id } : { seriesId: title.id }),
      watchlisted: true,
    } as never);

    const body = await readJson<FollowingBody>(viewer.jar, `${kind.base}/${title.tmdbId}/following`);

    expect(body.summary).toEqual({ count: 2, ratedCount: 2, reviewCount: 1, averageRating: 7 });
    expect(body.people.map((person) => person.username)).toEqual([rated.username, logged.username]);
    expect(body.people[0]).toMatchObject({
      liked: true,
      watched: true,
      rating: 8,
      watchedDate: "2026-03-01",
      reviewId,
    });
    expect(body.people[1]).toMatchObject({ liked: false, watched: true, rating: 6, reviewId: null });
  });

  it("leaves out suspended, muted and blocked users", async () => {
    const [viewer, visible, suspended, expired, muted, blocker] = await Promise.all([
      signUp("gv"),
      signUp("ga"),
      signUp("gb"),
      signUp("gc"),
      signUp("gd"),
      signUp("ge"),
    ]);
    const title = await kind.seed();
    const followees = [visible, suspended, expired, muted, blocker];
    await Promise.all(followees.map((followee) => follow(viewer.id, followee.id)));
    await Promise.all(followees.map((followee) => kind.interact(followee.id, title, { rating: 5, watched: true })));

    await Promise.all([
      db.update(profiles).set({ isSuspended: true }).where(eq(profiles.userId, suspended.id)),
      // A timed Suspension that has already ended no longer hides anyone.
      db
        .update(profiles)
        .set({ isSuspended: true, suspendedUntil: new Date(Date.now() - 60_000) })
        .where(eq(profiles.userId, expired.id)),
      db.insert(userMutes).values({ muterId: viewer.id, mutedId: muted.id }),
      db.insert(userBlocks).values({ blockerId: blocker.id, blockedId: viewer.id }),
    ]);

    const body = await readJson<FollowingBody>(viewer.jar, `${kind.base}/${title.tmdbId}/following`);
    expect(body.people.map((person) => person.username).sort()).toEqual(
      [visible.username, expired.username].sort(),
    );
    expect(body.summary.count).toBe(2);
  });

  it("returns an empty result for an uncached title without caching it", async () => {
    const viewer = await signUp("hv");
    const tmdbId = 998_999_000 + Math.floor(Math.random() * 999);
    const body = await readJson<FollowingBody>(viewer.jar, `${kind.base}/${tmdbId}/following`);

    expect(body).toEqual({
      summary: { count: 0, ratedCount: 0, reviewCount: 0, averageRating: null },
      people: [],
      limit: 50,
    });
    const cached =
      kind.mediaType === "movie"
        ? await db.select({ id: films.id }).from(films).where(eq(films.tmdbId, tmdbId))
        : await db.select({ id: tvSeries.id }).from(tvSeries).where(eq(tvSeries.tmdbId, tmdbId));
    expect(cached).toHaveLength(0);
  });

  it("filters the reviews list to followed authors on the following sort", async () => {
    const [viewer, followed, stranger] = await Promise.all([signUp("rv"), signUp("ra"), signUp("rb")]);
    const title = await kind.seed();
    await follow(viewer.id, followed.id);
    const followedReviewId = await review(followed.id, title, "From a friend");
    await review(stranger.id, title, "From a stranger");

    type ReviewsPage = { items: { id: string }[]; totalCount: number };
    const reviewsPath = `${kind.base}/${title.tmdbId}/reviews`;
    const following = await readJson<ReviewsPage>(viewer.jar, `${reviewsPath}?reviewsSort=following`);
    expect(following.items.map((item) => item.id)).toEqual([followedReviewId]);
    expect(following.totalCount).toBe(1);

    const recent = await readJson<ReviewsPage>(viewer.jar, `${reviewsPath}?reviewsSort=recent`);
    expect(recent.totalCount).toBe(2);
  });
});

describe("Series: from people you follow", () => {
  it("lists a followee still watching with their watch status, not as watched", async () => {
    const [viewer, watching] = await Promise.all([signUp("sv"), signUp("sa")]);
    const series = await seedTestSeries();
    await follow(viewer.id, watching.id);
    await KINDS[1]!.interact(watching.id, series, { watchStatus: "watching" });

    const body = await readJson<FollowingBody>(viewer.jar, `/api/serials/${series.tmdbId}/following`);
    expect(body.people).toEqual([
      expect.objectContaining({ username: watching.username, watched: false, watchStatus: "watching" }),
    ]);
    expect(body.summary).toMatchObject({ count: 1, ratedCount: 0, averageRating: null });
  });
});
