import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../../../src/infrastructure/database/db";
import { reviews } from "../../../src/modules/reviews/reviews.entity";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestFilm } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";

describe("GET /api/public/:username/reviews", () => {
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

  it("returns the newest reviews when limited, whatever order they were written in", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "pubrevorder");
    const days = ["2026-04-01", "2026-09-01", "2026-04-02", "2026-10-01"];

    for (const day of days) {
      const movie = await seedTestFilm(`Review order ${day}`);
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/reviews",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ tmdbId: movie.tmdbId, content: `Written ${day}` }),
        },
        jar,
      );
      const { review } = (await response.json()) as { review: { id: string } };
      await db.update(reviews).set({ createdAt: new Date(`${day}T12:00:00Z`) }).where(eq(reviews.id, review.id));
    }

    const response = await apiRequest(getServer().baseUrl, `/api/public/${username}/reviews?limit=2`);
    expect(response.status).toBe(200);
    const body = (await response.json()) as Array<{ content: string }>;
    expect(body.map((review) => review.content)).toEqual(["Written 2026-10-01", "Written 2026-09-01"]);
  });
});
