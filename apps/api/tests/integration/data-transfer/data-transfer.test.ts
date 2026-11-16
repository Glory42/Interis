import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestFilm, seedTestSeries } from "../../support/factories/media.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("data-transfer", () => {
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

  describe("GET /api/data/export", () => {
    it("requires auth", async () => {
      const response = await apiRequest(getServer().baseUrl, "/api/data/export");
      expect(response.status).toBe(401);
    });

    it("exports the user's diary as CSV with the expected headers", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "dtexport");
      const movie = await seedTestFilm("Export Test Movie");

      await apiRequest(
        getServer().baseUrl,
        "/api/diary",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ tmdbId: movie.tmdbId, watchedDate: "2024-01-15", rating: 8 }),
        },
        jar,
      );

      const response = await apiRequest(getServer().baseUrl, "/api/data/export", {}, jar);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/csv");
      expect(response.headers.get("content-disposition")).toContain("interis-diary-");

      const csv = await response.text();
      const [headerLine, ...dataLines] = csv.trim().split("\n");
      expect(headerLine).toBe(
        "WatchedDate,MediaType,Title,Year,TmdbId,Rating,Rewatch,Review,Spoilers,Note,Tags",
      );
      expect(dataLines.some((line) => line.includes(String(movie.tmdbId)))).toBe(true);
      expect(dataLines.some((line) => line.includes("Export Test Movie"))).toBe(true);
    });
  });

  describe("POST /api/data/import", () => {
    it("requires auth", async () => {
      const response = await apiRequest(getServer().baseUrl, "/api/data/import", {
        method: "POST",
        headers: { "content-type": "text/csv" },
        body: "WatchedDate,Title\n2024-01-01,Film\n",
      });
      expect(response.status).toBe(401);
    });

    it("rejects an empty request body", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "dtimportempty");
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/data/import",
        {
          method: "POST",
          headers: { "content-type": "text/csv" },
          body: "   ",
        },
        jar,
      );
      expect(response.status).toBe(400);
    });

    it("streams a failed row for an unrecognized CSV format", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "dtimportbadformat");
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/data/import",
        {
          method: "POST",
          headers: { "content-type": "text/csv" },
          body: "Foo,Bar\nbaz,qux\n",
        },
        jar,
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/x-ndjson");

      const events = (await response.text())
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line));
      expect(events.some((e) => e.type === "row" && e.status === "failed")).toBe(true);
      expect(events.at(-1)).toMatchObject({ type: "done", failed: 1, imported: 0 });
    });

    it("imports an Interis-format row referencing an existing movie, without touching TMDB", async () => {
      // Interis format rows carry an explicit TmdbId, so resolveMedia()
      // short-circuits before ever calling out to TMDB search - safe to
      // exercise the full import pipeline offline in this test env.
      const { jar } = await signUpTestUser(getServer().baseUrl, "dtimportinteris");
      const movie = await seedTestFilm("Import Test Movie");

      const csv = [
        "WatchedDate,MediaType,Title,Year,TmdbId,Rating,Rewatch,Review,Spoilers",
        `2024-02-01,movie,Import Test Movie,2020,${movie.tmdbId},4,false,,false`,
        "",
      ].join("\n");

      const response = await apiRequest(
        getServer().baseUrl,
        "/api/data/import",
        {
          method: "POST",
          headers: { "content-type": "text/csv" },
          body: csv,
        },
        jar,
      );
      expect(response.status).toBe(200);

      const events = (await response.text())
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line));
      expect(events[0]).toMatchObject({ type: "start", total: 1 });
      expect(events.some((e) => e.type === "row" && e.status === "imported")).toBe(true);
      expect(events.at(-1)).toMatchObject({ type: "done", imported: 1, failed: 0 });

      const diaryResponse = await apiRequest(getServer().baseUrl, "/api/diary", {}, jar);
      const diary = (await diaryResponse.json()) as Array<{ movieTmdbId: number }>;
      expect(diary.some((entry) => entry.movieTmdbId === movie.tmdbId)).toBe(true);
    });

    it("saves the row's review text for an imported TV series diary entry, same as for a movie", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "dtimportserialreview");
      const serial = await seedTestSeries("Import Test Serial");

      const csv = [
        "WatchedDate,MediaType,Title,Year,TmdbId,Rating,Rewatch,Review,Spoilers",
        `2024-02-01,tv,Import Test Serial,2020,${serial.tmdbId},4,false,Great show,false`,
        "",
      ].join("\n");

      const response = await apiRequest(
        getServer().baseUrl,
        "/api/data/import",
        { method: "POST", headers: { "content-type": "text/csv" }, body: csv },
        jar,
      );
      expect(response.status).toBe(200);

      const events = (await response.text())
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line));
      expect(events.some((e) => e.type === "row" && e.status === "imported")).toBe(true);

      const logsResponse = await apiRequest(getServer().baseUrl, "/api/serials/logs", {}, jar);
      const logs = (await logsResponse.json()) as Array<{
        seriesTmdbId: number;
        reviewContent: string | null;
      }>;
      const importedLog = logs.find((log) => log.seriesTmdbId === serial.tmdbId);
      expect(importedLog?.reviewContent).toBe("Great show");
    });

    it("skips a re-import of the same diary entry instead of duplicating it", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "dtimportdupe");
      const movie = await seedTestFilm("Duplicate Import Movie");
      const csv = [
        "WatchedDate,MediaType,Title,Year,TmdbId,Rating,Rewatch,Review,Spoilers",
        `2024-03-01,movie,Duplicate Import Movie,2020,${movie.tmdbId},,false,,false`,
        "",
      ].join("\n");

      // The import streams NDJSON progress - drain the first response so its insert has
      // landed before the second import runs its "already in diary" check.
      const firstResponse = await apiRequest(
        getServer().baseUrl,
        "/api/data/import",
        { method: "POST", headers: { "content-type": "text/csv" }, body: csv },
        jar,
      );
      await firstResponse.text();

      const secondResponse = await apiRequest(
        getServer().baseUrl,
        "/api/data/import",
        { method: "POST", headers: { "content-type": "text/csv" }, body: csv },
        jar,
      );
      const events = (await secondResponse.text())
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line));
      expect(events.at(-1)).toMatchObject({ type: "done", imported: 0, skipped: 1 });
    });
  });

  describe("notes and tags round trip", () => {
    const postJson = (path: string, body: unknown, jar: Parameters<typeof apiRequest>[3]) =>
      apiRequest(
        getServer().baseUrl,
        path,
        { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
        jar,
      );

    it("exports each log's private note and tags and imports them back into another account", async () => {
      const source = await signUpTestUser(getServer().baseUrl, "dtnotesrc");
      const target = await signUpTestUser(getServer().baseUrl, "dtnotedst");
      const movie = await seedTestFilm("Round Trip Movie");
      const serial = await seedTestSeries("Round Trip Serial");

      await postJson(
        "/api/diary",
        { tmdbId: movie.tmdbId, watchedDate: "2024-05-01", note: 'With "quotes", commas\nand lines', tags: ["cinema", "with mom"] },
        source.jar,
      );
      await postJson(`/api/serials/${serial.tmdbId}/log`, { watchedDate: "2024-05-02", tags: ["binge"] }, source.jar);

      const csv = await (await apiRequest(getServer().baseUrl, "/api/data/export", {}, source.jar)).text();
      expect(csv).toContain('"cinema, with mom"');

      const importResponse = await apiRequest(
        getServer().baseUrl,
        "/api/data/import",
        { method: "POST", headers: { "content-type": "text/csv" }, body: csv },
        target.jar,
      );
      const events = (await importResponse.text()).trim().split("\n").map((line) => JSON.parse(line));
      expect(events.at(-1)).toMatchObject({ type: "done", imported: 2, failed: 0 });

      const diary = (await (
        await apiRequest(getServer().baseUrl, `/api/users/${target.username}/diary`, {}, target.jar)
      ).json()) as { media: { tmdbId: number }; note?: string | null; tags: string[] }[];
      const movieItem = diary.find((item) => item.media.tmdbId === movie.tmdbId);
      const serialItem = diary.find((item) => item.media.tmdbId === serial.tmdbId);
      expect(movieItem?.note).toBe('With "quotes", commas\nand lines');
      expect(movieItem?.tags).toEqual(["cinema", "with mom"]);
      expect(serialItem?.note).toBeNull();
      expect(serialItem?.tags).toEqual(["binge"]);
    });

    it("cleans up a hand-edited Tags cell instead of failing the row", async () => {
      const { jar, username } = await signUpTestUser(getServer().baseUrl, "dtlbtags");
      const movie = await seedTestFilm("Letterboxd Tagged Movie");
      // Letterboxd rows need a TMDB search; their Tags mapping is covered by the normalizer unit tests.
      const csv = [
        "WatchedDate,MediaType,Title,Year,TmdbId,Rating,Rewatch,Review,Spoilers,Tags",
        `2024-06-01,movie,Letterboxd Tagged Movie,2020,${movie.tmdbId},,false,,false,"#Cinema, w/ mom, 🎬"`,
        "",
      ].join("\n");
      await (
        await apiRequest(
          getServer().baseUrl,
          "/api/data/import",
          { method: "POST", headers: { "content-type": "text/csv" }, body: csv },
          jar,
        )
      ).text();

      const diary = (await (
        await apiRequest(getServer().baseUrl, `/api/users/${username}/diary`, {}, jar)
      ).json()) as { tags: string[] }[];
      expect(diary[0]?.tags).toEqual(["cinema", "w mom"]);
    });
  });
});
