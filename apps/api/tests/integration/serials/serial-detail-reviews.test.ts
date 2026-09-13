import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestSerial } from "../../support/factories/media.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

// Mirrors tests/integration/movies/movie-detail.test.ts's review pagination coverage.
describe("serial detail reviews pagination", () => {
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

  const logSerial = async (
    username: string,
    tmdbId: number,
    extra: Record<string, unknown>,
  ) => {
    const { jar } = await signUpTestUser(getServer().baseUrl, username);
    const response = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${tmdbId}/log`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ watchedDate: "2026-01-01", ...extra }),
      },
      jar,
    );
    const body = (await response.json()) as {
      entry: { id: string };
      review: { id: string } | null;
    };
    return { jar, entryId: body.entry.id, reviewId: body.review?.id ?? null };
  };

  describe("GET /api/serials/:tmdbId/detail", () => {
    it("bounds the embedded review page while reviewCount still reflects the true total", async () => {
      const serial = await seedTestSerial("Detail Bounded Reviews Serial");
      await logSerial("sdbound1", serial.tmdbId, { review: "one" });
      await logSerial("sdbound2", serial.tmdbId, { review: "two" });
      await logSerial("sdbound3", serial.tmdbId, { review: "three" });

      const response = await apiRequest(
        getServer().baseUrl,
        `/api/serials/${serial.tmdbId}/detail?reviewsLimit=2`,
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
  });

  describe("GET /api/serials/:tmdbId/reviews", () => {
    it("paginates: page 1 has hasMore=true, page 2 has the remainder and hasMore=false", async () => {
      const serial = await seedTestSerial("Reviews Page Serial");
      await logSerial("srpg1", serial.tmdbId, { review: "alpha" });
      await logSerial("srpg2", serial.tmdbId, { review: "beta" });
      await logSerial("srpg3", serial.tmdbId, { review: "gamma" });

      const page1Response = await apiRequest(
        getServer().baseUrl,
        `/api/serials/${serial.tmdbId}/reviews?reviewsLimit=2&reviewsPage=1`,
      );
      const page1 = (await page1Response.json()) as {
        items: Array<{ id: string }>;
        totalCount: number;
        hasMore: boolean;
      };

      expect(page1.totalCount).toBe(3);
      expect(page1.items.length).toBe(2);
      expect(page1.hasMore).toBe(true);

      const page2Response = await apiRequest(
        getServer().baseUrl,
        `/api/serials/${serial.tmdbId}/reviews?reviewsLimit=2&reviewsPage=2`,
      );
      const page2 = (await page2Response.json()) as {
        items: Array<{ id: string }>;
        hasMore: boolean;
      };

      expect(page2.items.length).toBe(1);
      expect(page2.hasMore).toBe(false);

      const page1Ids = new Set(page1.items.map((item) => item.id));
      expect(page2.items.every((item) => !page1Ids.has(item.id))).toBe(true);
    });

    it("orders by like count across pages when reviewsSort=popular", async () => {
      const serial = await seedTestSerial("Reviews Page Popular Sort Serial");
      const { reviewId: mostLikedId } = await logSerial("srpop1", serial.tmdbId, {
        review: "most liked",
      });
      if (!mostLikedId) throw new Error("Expected a review id");
      await logSerial("srpop2", serial.tmdbId, { review: "unliked" });
      const { jar: likerJar } = await signUpTestUser(getServer().baseUrl, "srpopliker");

      await apiRequest(
        getServer().baseUrl,
        `/api/reviews/${mostLikedId}/like`,
        { method: "POST" },
        likerJar,
      );

      const response = await apiRequest(
        getServer().baseUrl,
        `/api/serials/${serial.tmdbId}/reviews?reviewsSort=popular&reviewsLimit=1`,
      );
      const page = (await response.json()) as {
        items: Array<{ id: string; likeCount: number }>;
      };

      expect(page.items[0]?.id).toBe(mostLikedId);
      expect(page.items[0]?.likeCount).toBe(1);
    });

    it("404s for a tmdbId that is neither cached locally nor resolvable via TMDB", async () => {
      const response = await apiRequest(getServer().baseUrl, "/api/serials/999000004/reviews");
      expect(response.status).toBe(404);
    });
  });
});
