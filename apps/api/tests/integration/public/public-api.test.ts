import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestMovie, seedTestSerial, seedTestTrack } from "../../support/factories/media.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("public widget API (/api/public/*)", () => {
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

  const unknownUsername = "no-such-public-user-xyz";

  const readOnlyEndpoints = [
    "profile",
    "activity",
    "recent",
    "reviews",
    "lists",
    "likes",
    "watchlist",
    "diary",
    "top4",
    "movies/watched",
    "serials/currently-watching",
    "serials/watched",
  ];

  describe("unknown username", () => {
    for (const endpoint of readOnlyEndpoints) {
      it(`returns 404 for GET /api/public/:username/${endpoint}`, async () => {
        const response = await apiRequest(
          getServer().baseUrl,
          `/api/public/${unknownUsername}/${endpoint}`,
        );
        expect(response.status).toBe(404);
      });
    }

    it("returns 404 for GET /api/public/:username/serials/:tmdbId", async () => {
      const response = await apiRequest(
        getServer().baseUrl,
        `/api/public/${unknownUsername}/serials/12345`,
      );
      expect(response.status).toBe(404);
    });
  });

  it("does not require auth and does not set the auth cookie contract", async () => {
    const { username } = await signUpTestUser(getServer().baseUrl, "pubauth");

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/public/${username}/profile`,
    );
    expect(response.status).toBe(200);
  });

  it("serves profile with cache headers and shape", async () => {
    const { username } = await signUpTestUser(getServer().baseUrl, "pprof");

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/public/${username}/profile`,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("public");
    expect(response.headers.get("vary")).toBe("Accept-Encoding");

    const body = (await response.json()) as {
      username: string;
      stats: unknown;
    };
    expect(body.username).toBe(username);
    expect(body.stats).toBeTruthy();
  });

  it("returns 400 for an invalid serials/:tmdbId", async () => {
    const { username } = await signUpTestUser(getServer().baseUrl, "pbadid");

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/public/${username}/serials/not-a-number`,
    );
    expect(response.status).toBe(400);
  });

  it("surfaces a movie diary entry with its review across diary/reviews/movies-watched", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "pdiary");
    const movie = await seedTestMovie("Public Diary Movie");

    const createResponse = await apiRequest(
      getServer().baseUrl,
      "/api/diary",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tmdbId: movie.tmdbId,
          watchedDate: "2026-01-05",
          rating: 8,
          review: "Loved it.",
          containsSpoilers: false,
        }),
      },
      jar,
    );
    expect(createResponse.status).toBe(201);

    const diaryResponse = await apiRequest(
      getServer().baseUrl,
      `/api/public/${username}/diary`,
    );
    expect(diaryResponse.status).toBe(200);
    const diaryEntries = (await diaryResponse.json()) as Array<{
      mediaType: string;
      media: { tmdbId: number };
      review: { content: string } | null;
    }>;
    expect(diaryEntries.length).toBeGreaterThanOrEqual(1);
    const entry = diaryEntries.find((e) => e.media.tmdbId === movie.tmdbId);
    expect(entry?.mediaType).toBe("movie");
    expect(entry?.review?.content).toBe("Loved it.");

    const reviewsResponse = await apiRequest(
      getServer().baseUrl,
      `/api/public/${username}/reviews`,
    );
    expect(reviewsResponse.status).toBe(200);
    const reviewsBody = (await reviewsResponse.json()) as unknown[];
    expect(reviewsBody.length).toBeGreaterThanOrEqual(1);

    const watchedResponse = await apiRequest(
      getServer().baseUrl,
      `/api/public/${username}/movies/watched`,
    );
    expect(watchedResponse.status).toBe(200);
    const watchedBody = (await watchedResponse.json()) as Array<{ tmdbId: number }>;
    expect(watchedBody.some((w) => w.tmdbId === movie.tmdbId)).toBe(true);
  });

  it("includes a track diary entry alongside movie/tv entries in the unified diary", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "ptrackdiary");
    const track = await seedTestTrack("Public Diary Track");

    const createResponse = await apiRequest(
      getServer().baseUrl,
      `/api/music/tracks/${track.mbid}/log`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ listenedDate: "2026-01-06", rating: 7 }),
      },
      jar,
    );
    expect(createResponse.status).toBe(201);

    const diaryResponse = await apiRequest(getServer().baseUrl, `/api/public/${username}/diary`);
    expect(diaryResponse.status).toBe(200);
    const diaryEntries = (await diaryResponse.json()) as Array<{
      mediaType: string;
      media: { mbid?: string | null; title: string; artistName?: string | null };
      rating: number | null;
    }>;

    const entry = diaryEntries.find((e) => e.media.mbid === track.mbid);
    expect(entry?.mediaType).toBe("track");
    expect(entry?.media.title).toBe("Public Diary Track");
    expect(entry?.media.artistName).toBe("Test Artist");
    expect(entry?.rating).toBe(7);
  });

  it("paginates diary with limit/offset across mixed movie+serial entries", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "ppage");

    const movieA = await seedTestMovie("Page Movie A");
    const movieB = await seedTestMovie("Page Movie B");
    const serial = await seedTestSerial("Page Serial");

    await apiRequest(
      getServer().baseUrl,
      "/api/diary",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tmdbId: movieA.tmdbId, watchedDate: "2026-01-01" }),
      },
      jar,
    );
    await apiRequest(
      getServer().baseUrl,
      "/api/diary",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tmdbId: movieB.tmdbId, watchedDate: "2026-01-02" }),
      },
      jar,
    );
    await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/log`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ watchedDate: "2026-01-03" }),
      },
      jar,
    );

    const fullResponse = await apiRequest(
      getServer().baseUrl,
      `/api/public/${username}/diary?limit=50`,
    );
    const full = (await fullResponse.json()) as unknown[];
    expect(full.length).toBe(3);

    const firstPageResponse = await apiRequest(
      getServer().baseUrl,
      `/api/public/${username}/diary?limit=1&offset=0`,
    );
    const firstPage = (await firstPageResponse.json()) as unknown[];
    expect(firstPage.length).toBe(1);

    const secondPageResponse = await apiRequest(
      getServer().baseUrl,
      `/api/public/${username}/diary?limit=1&offset=1`,
    );
    const secondPage = (await secondPageResponse.json()) as unknown[];
    expect(secondPage.length).toBe(1);
    expect(secondPage).not.toEqual(firstPage);
  });

  it("only surfaces public lists with their movie items", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "plist");
    const movie = await seedTestMovie("Public List Movie");

    const publicListResponse = await apiRequest(
      getServer().baseUrl,
      "/api/lists",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "Public List", isPublic: true }),
      },
      jar,
    );
    const publicList = (await publicListResponse.json()) as { id: string };

    await apiRequest(
      getServer().baseUrl,
      `/api/lists/${publicList.id}/items`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tmdbId: movie.tmdbId, itemType: "cinema" }),
      },
      jar,
    );

    const privateListResponse = await apiRequest(
      getServer().baseUrl,
      "/api/lists",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "Private List", isPublic: false }),
      },
      jar,
    );
    const privateList = (await privateListResponse.json()) as { id: string };
    expect(privateList.id).toBeTruthy();

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/public/${username}/lists`,
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as Array<{
      id: string;
      title: string;
      itemCount: number;
      items: Array<{ tmdbId: number }>;
    }>;

    expect(body.some((l) => l.id === privateList.id)).toBe(false);
    const list = body.find((l) => l.id === publicList.id);
    expect(list?.itemCount).toBe(1);
    expect(list?.items[0]?.tmdbId).toBe(movie.tmdbId);
  });

  it("surfaces liked and watchlisted movies", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "pinter");
    const liked = await seedTestMovie("Liked Movie");
    const watchlisted = await seedTestMovie("Watchlisted Movie");

    await apiRequest(
      getServer().baseUrl,
      `/api/interactions/${liked.tmdbId}`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ liked: true }),
      },
      jar,
    );
    await apiRequest(
      getServer().baseUrl,
      `/api/interactions/${watchlisted.tmdbId}`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ watchlisted: true }),
      },
      jar,
    );

    const likesResponse = await apiRequest(
      getServer().baseUrl,
      `/api/public/${username}/likes`,
    );
    const likesBody = (await likesResponse.json()) as Array<{ tmdbId: number }>;
    expect(likesBody.some((m) => m.tmdbId === liked.tmdbId)).toBe(true);
    expect(likesBody.some((m) => m.tmdbId === watchlisted.tmdbId)).toBe(false);

    const watchlistResponse = await apiRequest(
      getServer().baseUrl,
      `/api/public/${username}/watchlist`,
    );
    const watchlistBody = (await watchlistResponse.json()) as Array<{ tmdbId: number }>;
    expect(watchlistBody.some((m) => m.tmdbId === watchlisted.tmdbId)).toBe(true);
    expect(watchlistBody.some((m) => m.tmdbId === liked.tmdbId)).toBe(false);
  });

  it("surfaces a serial diary log in serials/watched", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "pserial");
    const serial = await seedTestSerial("Public Serial Watched");

    await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/log`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ watchedDate: "2026-01-06" }),
      },
      jar,
    );

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/public/${username}/serials/watched`,
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as Array<{ tmdbId: number }>;
    expect(body.some((s) => s.tmdbId === serial.tmdbId)).toBe(true);
  });

  it("returns an empty array for currently-watching when the user has no in-progress series", async () => {
    const { username } = await signUpTestUser(getServer().baseUrl, "pcw");

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/public/${username}/serials/currently-watching`,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it("returns null-safe top4 for a user with no favorites set", async () => {
    const { username } = await signUpTestUser(getServer().baseUrl, "ptop4");

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/public/${username}/top4`,
    );
    expect(response.status).toBe(200);
  });

  it("enforces the 60/min public rate limit independently of the mutation/auth limiters", async () => {
    const { username } = await signUpTestUser(getServer().baseUrl, "prate");

    const statuses: number[] = [];
    for (let i = 0; i < 61; i += 1) {
      const response = await apiRequest(
        getServer().baseUrl,
        `/api/public/${username}/profile`,
      );
      statuses.push(response.status);
    }

    expect(statuses.at(-1)).toBe(429);
  });
});
