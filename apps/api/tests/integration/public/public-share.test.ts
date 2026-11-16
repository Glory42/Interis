import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestFilm, seedTestSeries } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";

type MetaJson = {
  kind: string;
  ogType: string;
  title: string;
  description: string;
  image: string | null;
  path: string;
};

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];

describe("link-preview meta and share cards (/api/public/meta, /api/public/og)", () => {
  let testServer: RunningTestServer | null = null;
  const baseUrl = () => {
    if (!testServer) throw new Error("Test server is not running");
    return testServer.baseUrl;
  };

  beforeAll(async () => {
    testServer = await startTestServer();
  });

  afterAll(async () => {
    await testServer?.close();
    testServer = null;
  });

  const post = (path: string, body: unknown, jar: CookieJar, method = "POST") =>
    apiRequest(baseUrl(), path, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) }, jar);

  const createReview = async (jar: CookieJar, tmdbId: number, content: string, extra: Record<string, unknown> = {}) => {
    const response = await post("/api/reviews", { tmdbId, content, ...extra }, jar);
    expect(response.status).toBe(201);
    return ((await response.json()) as { review: { id: string } }).review.id;
  };

  const createList = async (jar: CookieJar, title: string, isPublic: boolean) => {
    const response = await post("/api/lists", { title, isPublic }, jar);
    expect(response.status).toBe(201);
    return ((await response.json()) as { id: string }).id;
  };

  const getMeta = async (path: string) => {
    const response = await apiRequest(baseUrl(), `/api/public/meta${path}`);
    return { response, body: response.status === 200 ? ((await response.json()) as MetaJson) : null };
  };

  const expectJpeg = async (path: string) => {
    const response = await apiRequest(baseUrl(), path);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(response.headers.get("cache-control")).toContain("public");
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual(JPEG_SIGNATURE);
    expect(bytes.length).toBeGreaterThan(1_000);
  };

  describe("review meta", () => {
    it("returns the review's title, excerpt, card and canonical path with CDN cache headers", async () => {
      const { jar, username } = await signUpTestUser(baseUrl(), "shrev");
      const film = await seedTestFilm("Share Test Film");
      const reviewId = await createReview(jar, film.tmdbId, "A slow, patient   film that\nrewards attention.");

      const { response, body } = await getMeta(`/review/${username}/${reviewId}`);
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("public, max-age=300, s-maxage=3600");
      expect(response.headers.get("access-control-allow-origin")).toBe("*");
      expect(body).toMatchObject({
        kind: "review",
        ogType: "article",
        title: `${username}'s review of Share Test Film`,
        description: "A slow, patient film that rewards attention.",
        path: `/reviews/${username}/${reviewId}`,
      });
      expect(body?.image).toMatch(new RegExp(`^/api/public/og/review/${reviewId}\\.jpg\\?v=[0-9a-z]+$`));
    });

    it("hides the text of a review marked as containing spoilers", async () => {
      const { jar, username } = await signUpTestUser(baseUrl(), "shspo");
      const film = await seedTestFilm("Twist Film");
      const reviewId = await createReview(jar, film.tmdbId, "The butler did it.", { containsSpoilers: true });

      const { body } = await getMeta(`/review/${username}/${reviewId}`);
      expect(body?.description).toBe("Contains spoilers for Twist Film. Read on Interis.");
    });

    it("404s for a removed review, another user's username, or a malformed id", async () => {
      const { jar, username } = await signUpTestUser(baseUrl(), "shdel");
      const other = await signUpTestUser(baseUrl(), "shoth");
      const film = await seedTestFilm();
      const reviewId = await createReview(jar, film.tmdbId, "Soon gone");

      expect((await getMeta(`/review/${other.username}/${reviewId}`)).response.status).toBe(404);
      expect((await getMeta(`/review/${username}/not-a-uuid`)).response.status).toBe(404);

      const deleted = await apiRequest(baseUrl(), `/api/reviews/${reviewId}`, { method: "DELETE" }, jar);
      expect(deleted.status).toBeLessThan(300);
      const gone = await getMeta(`/review/${username}/${reviewId}`);
      expect(gone.response.status).toBe(404);
      expect(gone.response.headers.get("cache-control")).toBe("public, max-age=60, s-maxage=300");
      expect((await apiRequest(baseUrl(), `/api/public/og/review/${reviewId}.jpg`)).status).toBe(404);
    });
  });

  describe("list meta", () => {
    it("serves a public list under its owner's profile path", async () => {
      const { jar, username } = await signUpTestUser(baseUrl(), "shlst");
      const listId = await createList(jar, "Comfort films", true);

      const { response, body } = await getMeta(`/list/${listId}`);
      expect(response.status).toBe(200);
      expect(body).toMatchObject({
        kind: "list",
        title: `Comfort films · a list by ${username}`,
        description: `0 titles curated by ${username} on Interis.`,
        path: `/profile/${username}/lists/${listId}`,
      });
    });

    it("404s for a private list, and for its card", async () => {
      const { jar } = await signUpTestUser(baseUrl(), "shprv");
      const listId = await createList(jar, "Secret list", false);

      expect((await getMeta(`/list/${listId}`)).response.status).toBe(404);
      expect((await apiRequest(baseUrl(), `/api/public/og/list/${listId}.jpg`)).status).toBe(404);
    });
  });

  describe("profile, film, series and person meta", () => {
    it("returns profile meta and 404s for an unknown user", async () => {
      const { username } = await signUpTestUser(baseUrl(), "shpro");
      const { body } = await getMeta(`/profile/${username}`);
      expect(body).toMatchObject({
        kind: "profile",
        ogType: "profile",
        title: `${username} (@${username})`,
        image: `/api/public/og/profile/${username}.jpg`,
        path: `/profile/${username}`,
      });
      expect((await getMeta("/profile/no-such-share-user")).response.status).toBe(404);
    });

    it("returns film, series and season meta from cached rows", async () => {
      const film = await seedTestFilm("Cached Film");
      const series = await seedTestSeries("Cached Series");

      expect((await getMeta(`/movie/${film.tmdbId}`)).body).toMatchObject({
        kind: "film",
        title: "Cached Film",
        description: "Cached Film on Interis.",
        path: `/movies/${film.tmdbId}`,
      });
      expect((await getMeta(`/serial/${series.tmdbId}`)).body).toMatchObject({ kind: "series", ogType: "video.tv_show" });
      expect((await getMeta(`/serial/${series.tmdbId}/season/2`)).body).toMatchObject({
        kind: "season",
        title: "Cached Series · Season 2",
        path: `/serials/${series.tmdbId}/season/2`,
      });
    });

    it("404s for malformed ids and unknown people without touching TMDB", async () => {
      expect((await getMeta("/movie/abc")).response.status).toBe(404);
      expect((await getMeta("/serial/12/season/x")).response.status).toBe(404);
      expect((await getMeta("/person/producer/someone")).response.status).toBe(404);
      expect((await getMeta("/person/actor/no-such-cached-person-xyz")).response.status).toBe(404);
    });

    it("leaves the widget routes for a user literally named like a share prefix alone", async () => {
      expect((await apiRequest(baseUrl(), "/api/public/meta/profile")).status).toBe(404);
    });
  });

  describe("share cards", () => {
    it("renders a JPEG for each card type", async () => {
      const { jar, username } = await signUpTestUser(baseUrl(), "shcrd");
      const film = await seedTestFilm("Card Film");
      const series = await seedTestSeries("Card Series");
      const reviewId = await createReview(jar, film.tmdbId, "Worth a rewatch.");
      const listId = await createList(jar, "Card list", true);
      expect((await post(`/api/lists/${listId}/items`, { tmdbId: series.tmdbId, itemType: "serial" }, jar)).status).toBe(201);

      await expectJpeg(`/api/public/og/review/${reviewId}.jpg`);
      await expectJpeg(`/api/public/og/list/${listId}.jpg`);
      await expectJpeg(`/api/public/og/profile/${username}.jpg`);
      await expectJpeg(`/api/public/og/movie/${film.tmdbId}.jpg`);
      await expectJpeg(`/api/public/og/serial/${series.tmdbId}.jpg`);
    });

    it("permanently redirects the old .png card URLs to the .jpg ones, keeping the version", async () => {
      const film = await seedTestFilm("Legacy Card Film");
      const response = await apiRequest(baseUrl(), `/api/public/og/movie/${film.tmdbId}.png?v=abc`, { redirect: "manual" });
      expect(response.status).toBe(301);
      expect(response.headers.get("location")).toBe(`/api/public/og/movie/${film.tmdbId}.jpg?v=abc`);
      expect(response.headers.get("cache-control")).toBe("public, max-age=86400");

      const profile = await apiRequest(baseUrl(), "/api/public/og/profile/someone.png", { redirect: "manual" });
      expect(profile.headers.get("location")).toBe("/api/public/og/profile/someone.jpg");
    });
  });
});
