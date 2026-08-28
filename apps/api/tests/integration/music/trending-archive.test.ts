import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { db } from "../../../src/infrastructure/database/db";
import { albums, lastfmTrendingCache } from "../../../src/modules/music/music.entity";
import { LASTFM_TRENDING_CHART_KEY } from "../../../src/modules/music/constants/music.constants";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("music trending archive (Last.fm charts)", () => {
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

  it("returns the Last.fm-ranked list, resolved against an already-cached album, without calling Last.fm or MusicBrainz", async () => {
    const mbid = crypto.randomUUID();

    await db.insert(albums).values({
      mbid,
      title: "The Test Album",
      artistName: "The Test Artist",
    });

    const items = [{ artistName: "The Test Artist", albumTitle: "The Test Album", mbid }];
    await db
      .insert(lastfmTrendingCache)
      .values({ chartKey: LASTFM_TRENDING_CHART_KEY, items })
      .onConflictDoUpdate({
        target: lastfmTrendingCache.chartKey,
        set: { items, fetchedAt: new Date() },
      });

    const response = await apiRequest(getServer().baseUrl, "/api/music/archive?sort=trending");
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      selectedSort: string;
      items: Array<{ mbid: string; title: string }>;
    };

    expect(body.selectedSort).toBe("trending");
    expect(body.items.some((item) => item.mbid === mbid)).toBe(true);
  });
});
