import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestMovie } from "../../support/factories/media.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

// The movie detail + basic read endpoints had no HTTP-level coverage. Every
// TMDB call in MoviesDetailService is wrapped in .catch(), so a seeded local
// movie exercises the full assembly path (logs count, review list + sort,
// rating breakdown, viewer rating) offline; the TMDB-only enrichments
// (cast, similar, budget) are simply absent, which is fine to assert.
describe("movie detail + basic reads", () => {
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

  const logMovie = async (
    username: string,
    tmdbId: number,
    extra: Record<string, unknown>,
  ) => {
    const { jar } = await signUpTestUser(getServer().baseUrl, username);
    const response = await apiRequest(
      getServer().baseUrl,
      "/api/diary",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tmdbId, watchedDate: "2026-01-01", ...extra }),
      },
      jar,
    );
    const body = (await response.json()) as {
      entry: { id: string };
      review: { id: string } | null;
    };
    return { jar, entryId: body.entry.id, reviewId: body.review?.id ?? null };
  };

  describe("GET /api/movies/:tmdbId/detail", () => {
    it("assembles logs count, review list, and rating breakdown for a locally-seeded movie", async () => {
      const movie = await seedTestMovie("Detail Aggregate Movie");
      await logMovie("mdagg1", movie.tmdbId, { rating: 8, review: "first take" });
      await logMovie("mdagg2", movie.tmdbId, { rating: 6, review: "second take" });

      const response = await apiRequest(
        getServer().baseUrl,
        `/api/movies/${movie.tmdbId}/detail`,
      );
      expect(response.status).toBe(200);

      const detail = (await response.json()) as {
        movie: { tmdbId: number; title: string };
        logsCount: number;
        reviewCount: number;
        reviews: Array<{ content: string; likeCount: number }>;
        ratingBreakdown: { totalRatedReviews: number; averageRating: number | null };
        userRating: unknown;
        similar: unknown[];
      };

      expect(detail.movie.tmdbId).toBe(movie.tmdbId);
      expect(detail.logsCount).toBe(2);
      expect(detail.reviewCount).toBe(2);
      expect(detail.reviews.map((r) => r.content).sort()).toEqual([
        "first take",
        "second take",
      ]);
      expect(detail.ratingBreakdown.totalRatedReviews).toBe(2);
      expect(detail.ratingBreakdown.averageRating).toBeCloseTo(7, 5);
      expect(detail.userRating).toBeNull();
      expect(detail.similar).toEqual([]);
    });

    it("returns the viewer's own rating when the request is authenticated", async () => {
      const movie = await seedTestMovie("Detail Viewer Rating Movie");
      const { jar, entryId } = await logMovie("mdviewer", movie.tmdbId, {
        rating: 9,
        review: "mine",
      });

      const response = await apiRequest(
        getServer().baseUrl,
        `/api/movies/${movie.tmdbId}/detail`,
        {},
        jar,
      );
      const detail = (await response.json()) as {
        userRating: { rating: number | null; diaryEntryId: string | null } | null;
      };

      expect(detail.userRating?.rating).toBe(9);
      expect(detail.userRating?.diaryEntryId).toBe(entryId);
    });

    it("orders reviews by like count when reviewsSort=popular", async () => {
      const movie = await seedTestMovie("Detail Popular Sort Movie");
      await logMovie("mdpop1", movie.tmdbId, { review: "unpopular" });
      const { jar: likerJar } = await signUpTestUser(getServer().baseUrl, "mdpopliker");
      const { reviewId: popularReviewId } = await logMovie("mdpop2", movie.tmdbId, {
        review: "popular",
      });

      await apiRequest(
        getServer().baseUrl,
        `/api/reviews/${popularReviewId}/like`,
        { method: "POST" },
        likerJar,
      );

      const response = await apiRequest(
        getServer().baseUrl,
        `/api/movies/${movie.tmdbId}/detail?reviewsSort=popular`,
      );
      const detail = (await response.json()) as {
        reviewsSort: string;
        reviews: Array<{ content: string; likeCount: number }>;
      };

      expect(detail.reviewsSort).toBe("popular");
      expect(detail.reviews[0]?.content).toBe("popular");
      expect(detail.reviews[0]?.likeCount).toBe(1);
    });

    it("bounds the embedded review page while reviewCount still reflects the true total", async () => {
      const movie = await seedTestMovie("Detail Bounded Reviews Movie");
      await logMovie("mdbound1", movie.tmdbId, { review: "one" });
      await logMovie("mdbound2", movie.tmdbId, { review: "two" });
      await logMovie("mdbound3", movie.tmdbId, { review: "three" });

      const response = await apiRequest(
        getServer().baseUrl,
        `/api/movies/${movie.tmdbId}/detail?reviewsLimit=2`,
      );
      const detail = (await response.json()) as {
        reviewCount: number;
        reviews: unknown[];
        reviewsPage: number;
        reviewsLimit: number;
        reviewsHasMore: boolean;
      };

      expect(detail.reviewCount).toBe(3);
      expect(detail.reviews.length).toBe(2);
      expect(detail.reviewsPage).toBe(1);
      expect(detail.reviewsLimit).toBe(2);
      expect(detail.reviewsHasMore).toBe(true);
    });

    it("400s on a non-numeric id", async () => {
      const response = await apiRequest(getServer().baseUrl, "/api/movies/not-a-number/detail");
      expect(response.status).toBe(400);
    });

    it("404s for a tmdbId that is neither cached locally nor resolvable via TMDB", async () => {
      const response = await apiRequest(getServer().baseUrl, "/api/movies/999000001/detail");
      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/movies/:tmdbId/reviews", () => {
    it("paginates: page 1 has hasMore=true, page 2 has the remainder and hasMore=false", async () => {
      const movie = await seedTestMovie("Reviews Page Movie");
      await logMovie("mdrpg1", movie.tmdbId, { review: "alpha" });
      await logMovie("mdrpg2", movie.tmdbId, { review: "beta" });
      await logMovie("mdrpg3", movie.tmdbId, { review: "gamma" });

      const page1Response = await apiRequest(
        getServer().baseUrl,
        `/api/movies/${movie.tmdbId}/reviews?reviewsLimit=2&reviewsPage=1`,
      );
      const page1 = (await page1Response.json()) as {
        items: Array<{ id: string; content: string }>;
        totalCount: number;
        hasMore: boolean;
        page: number;
        limit: number;
      };

      expect(page1.totalCount).toBe(3);
      expect(page1.items.length).toBe(2);
      expect(page1.hasMore).toBe(true);
      expect(page1.page).toBe(1);
      expect(page1.limit).toBe(2);

      const page2Response = await apiRequest(
        getServer().baseUrl,
        `/api/movies/${movie.tmdbId}/reviews?reviewsLimit=2&reviewsPage=2`,
      );
      const page2 = (await page2Response.json()) as {
        items: Array<{ id: string }>;
        hasMore: boolean;
      };

      expect(page2.items.length).toBe(1);
      expect(page2.hasMore).toBe(false);

      // No review appears on both pages.
      const page1Ids = new Set(page1.items.map((item) => item.id));
      expect(page2.items.every((item) => !page1Ids.has(item.id))).toBe(true);
    });

    it("orders by like count across pages when reviewsSort=popular", async () => {
      const movie = await seedTestMovie("Reviews Page Popular Sort Movie");
      const { reviewId: mostLikedId } = await logMovie("mdrpop1", movie.tmdbId, {
        review: "most liked",
      });
      if (!mostLikedId) throw new Error("Expected a review id");
      await logMovie("mdrpop2", movie.tmdbId, { review: "unliked" });
      const { jar: likerJar } = await signUpTestUser(getServer().baseUrl, "mdrpopliker");

      await apiRequest(
        getServer().baseUrl,
        `/api/reviews/${mostLikedId}/like`,
        { method: "POST" },
        likerJar,
      );

      const response = await apiRequest(
        getServer().baseUrl,
        `/api/movies/${movie.tmdbId}/reviews?reviewsSort=popular&reviewsLimit=1`,
      );
      const page = (await response.json()) as {
        items: Array<{ id: string; likeCount: number }>;
      };

      expect(page.items[0]?.id).toBe(mostLikedId);
      expect(page.items[0]?.likeCount).toBe(1);
    });

    it("404s for a tmdbId that is neither cached locally nor resolvable via TMDB", async () => {
      const response = await apiRequest(getServer().baseUrl, "/api/movies/999000003/reviews");
      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/movies/:tmdbId", () => {
    it("returns the cached row for a seeded movie", async () => {
      const movie = await seedTestMovie("Basic Read Movie");
      const response = await apiRequest(getServer().baseUrl, `/api/movies/${movie.tmdbId}`);
      expect(response.status).toBe(200);
      const body = (await response.json()) as { tmdbId: number; title: string };
      expect(body.tmdbId).toBe(movie.tmdbId);
      expect(body.title).toBe("Basic Read Movie");
    });

    it("400s on a non-numeric id and 404s for an unresolvable tmdbId", async () => {
      expect((await apiRequest(getServer().baseUrl, "/api/movies/nope")).status).toBe(400);
      expect((await apiRequest(getServer().baseUrl, "/api/movies/999000002")).status).toBe(404);
    });
  });

  describe("GET /api/movies/:tmdbId/logs", () => {
    it("lists the public logs for a movie", async () => {
      const movie = await seedTestMovie("Logs List Movie");
      await logMovie("mdlogs1", movie.tmdbId, { rating: 7 });

      const response = await apiRequest(
        getServer().baseUrl,
        `/api/movies/${movie.tmdbId}/logs`,
      );
      expect(response.status).toBe(200);
      const logs = (await response.json()) as unknown[];
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBe(1);
    });
  });
});
