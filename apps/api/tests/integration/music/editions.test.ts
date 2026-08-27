import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { seedTestAlbum } from "../../support/factories/media.factory";
import { db } from "../../../src/infrastructure/database/db";
import { editions, editionTracks, tracks } from "../../../src/modules/music/music.entity";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("music editions", () => {
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

  describe("GET /api/music/:mbid/editions", () => {
    it("returns 400 for a malformed album id", async () => {
      const response = await apiRequest(getServer().baseUrl, "/api/music/not-a-uuid/editions");
      expect(response.status).toBe(400);
    });

    it("lists the album's cached editions sorted official-first, then earliest release date", async () => {
      const album = await seedTestAlbum();
      const [officialLate, bootlegEarly, officialEarly] = await db
        .insert(editions)
        .values([
          {
            albumId: album.id,
            mbid: crypto.randomUUID(),
            title: "Official Late Reissue",
            status: "Official",
            releaseDate: "2009-01-01",
          },
          {
            albumId: album.id,
            mbid: crypto.randomUUID(),
            title: "Bootleg",
            status: "Bootleg",
            releaseDate: "1996-01-01",
          },
          {
            albumId: album.id,
            mbid: crypto.randomUUID(),
            title: "Official Original",
            status: "Official",
            releaseDate: "1997-05-21",
          },
        ])
        .returning();

      const response = await apiRequest(
        getServer().baseUrl,
        `/api/music/${album.mbid}/editions`,
      );
      expect(response.status).toBe(200);
      const body = (await response.json()) as { editions: Array<{ mbid: string }> };

      const titlesInOrder = body.editions.map((e) => e.mbid);
      expect(titlesInOrder).toEqual([
        officialEarly!.mbid,
        officialLate!.mbid,
        bootlegEarly!.mbid,
      ]);
    });
  });

  describe("GET /api/music/editions/:editionMbid/tracks", () => {
    it("returns 400 for a malformed edition id", async () => {
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/music/editions/not-a-uuid/tracks",
      );
      expect(response.status).toBe(400);
    });

    it("returns 404 when the edition doesn't exist", async () => {
      const response = await apiRequest(
        getServer().baseUrl,
        `/api/music/editions/${crypto.randomUUID()}/tracks`,
      );
      expect(response.status).toBe(404);
    });

    it("returns the edition's cached tracklist ordered by disc and position", async () => {
      const album = await seedTestAlbum();
      const [edition] = await db
        .insert(editions)
        .values({ albumId: album.id, mbid: crypto.randomUUID(), title: "Test Edition" })
        .returning();

      const [trackTwo, trackOne] = await db
        .insert(tracks)
        .values([
          { mbid: crypto.randomUUID(), title: "Paranoid Android", artistName: "Radiohead" },
          { mbid: crypto.randomUUID(), title: "Airbag", artistName: "Radiohead" },
        ])
        .returning();

      await db.insert(editionTracks).values([
        { editionId: edition!.id, trackId: trackTwo!.id, discNumber: 1, position: 2 },
        { editionId: edition!.id, trackId: trackOne!.id, discNumber: 1, position: 1 },
      ]);

      const response = await apiRequest(
        getServer().baseUrl,
        `/api/music/editions/${edition!.mbid}/tracks`,
      );
      expect(response.status).toBe(200);
      const body = (await response.json()) as { tracks: Array<{ title: string }> };

      expect(body.tracks.map((t) => t.title)).toEqual(["Airbag", "Paranoid Android"]);
    });
  });
});
