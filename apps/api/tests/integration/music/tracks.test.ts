import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestTrack } from "../../support/factories/media.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("music tracks", () => {
  let testServer: RunningTestServer | null = null;

  const getServer = (): RunningTestServer => {
    if (!testServer) {
      throw new Error("Test server is not running");
    }
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

  describe("GET /api/music/tracks/:mbid", () => {
    it("returns 400 for a malformed track id", async () => {
      const response = await apiRequest(getServer().baseUrl, "/api/music/tracks/not-a-uuid");
      expect(response.status).toBe(400);
    });

    it("returns the cached track", async () => {
      const track = await seedTestTrack("Airbag");
      const response = await apiRequest(getServer().baseUrl, `/api/music/tracks/${track.mbid}`);
      expect(response.status).toBe(200);
      const body = (await response.json()) as { title: string };
      expect(body.title).toBe("Airbag");
    });
  });

  describe("track interaction", () => {
    it("requires auth", async () => {
      const track = await seedTestTrack();
      const response = await apiRequest(
        getServer().baseUrl,
        `/api/music/tracks/${track.mbid}/interaction`,
      );
      expect(response.status).toBe(401);
    });

    it("likes and rates a track, then reflects that on GET", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "tracklike1");
      const track = await seedTestTrack();

      const putResponse = await apiRequest(
        getServer().baseUrl,
        `/api/music/tracks/${track.mbid}/interaction`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ liked: true, rating: 8.5 }),
        },
        jar,
      );
      expect(putResponse.status).toBe(200);

      const getResponse = await apiRequest(
        getServer().baseUrl,
        `/api/music/tracks/${track.mbid}/interaction`,
        {},
        jar,
      );
      const body = (await getResponse.json()) as { liked: boolean; rating: number };
      expect(body.liked).toBe(true);
      expect(body.rating).toBe(8.5);
    });
  });

  describe("track diary log", () => {
    it("creates, updates, and deletes a log entry", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "tracklog1");
      const track = await seedTestTrack();

      const createResponse = await apiRequest(
        getServer().baseUrl,
        `/api/music/tracks/${track.mbid}/log`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ listenedDate: "2026-01-01", rating: 7 }),
        },
        jar,
      );
      expect(createResponse.status).toBe(201);
      const created = (await createResponse.json()) as { entry: { id: string } };

      const updateResponse = await apiRequest(
        getServer().baseUrl,
        `/api/music/tracks/logs/${created.entry.id}`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ rating: 9 }),
        },
        jar,
      );
      expect(updateResponse.status).toBe(200);

      const deleteResponse = await apiRequest(
        getServer().baseUrl,
        `/api/music/tracks/logs/${created.entry.id}`,
        { method: "DELETE" },
        jar,
      );
      expect(deleteResponse.status).toBe(200);
    });
  });

  describe("track reviews", () => {
    it("can be reviewed through the shared /api/reviews endpoint", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "trackreview1");
      const track = await seedTestTrack();

      const response = await apiRequest(
        getServer().baseUrl,
        "/api/reviews",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            mediaSourceId: track.mbid,
            mediaType: "track",
            content: "A great track.",
          }),
        },
        jar,
      );

      expect(response.status).toBe(201);
      const body = (await response.json()) as { review: { content: string } };
      expect(body.review.content).toBe("A great track.");
    });

    it("shows up on the track's own detail endpoint afterwards", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "trackreview2");
      const track = await seedTestTrack();

      await apiRequest(
        getServer().baseUrl,
        "/api/reviews",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            mediaSourceId: track.mbid,
            mediaType: "track",
            content: "A great track.",
          }),
        },
        jar,
      );

      const detailResponse = await apiRequest(
        getServer().baseUrl,
        `/api/music/tracks/${track.mbid}/detail`,
      );
      expect(detailResponse.status).toBe(200);
      const detail = (await detailResponse.json()) as {
        track: { mbid: string };
        reviewCount: number;
        reviews: Array<{ content: string }>;
      };
      expect(detail.track.mbid).toBe(track.mbid);
      expect(detail.reviewCount).toBe(1);
      expect(detail.reviews[0]?.content).toBe("A great track.");
    });
  });
});
