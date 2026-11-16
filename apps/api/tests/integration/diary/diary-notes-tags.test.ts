import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser, type SignedUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { promoteToAdmin } from "../../support/factories/admin.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import {
  WATCH_LOG_MEDIA,
  diaryActivitiesOf,
  waitForActivityWrite,
  watchLogClient,
} from "../../support/factories/watch-log.factory";

type DiaryItemJson = {
  id: string;
  mediaType: string;
  media: { tmdbId: number };
  tags: string[];
  note?: string | null;
};

// Private notes reach their owner only; tags are public, filterable and counted.
describe.each(WATCH_LOG_MEDIA)("$label log notes and tags", (media) => {
  let testServer: RunningTestServer | null = null;
  let owner: SignedUpTestUser;
  let follower: SignedUpTestUser;
  let admin: SignedUpTestUser;
  const baseUrl = () => {
    if (!testServer) throw new Error("Test server is not running");
    return testServer.baseUrl;
  };
  const client = watchLogClient(baseUrl, media);

  // The raw body, so a leak anywhere in the JSON is caught.
  const readText = async (path: string, jar?: CookieJar) => {
    const response = await apiRequest(baseUrl(), path, {}, jar);
    expect(response.status).toBe(200);
    return response.text();
  };

  const diaryOf = async (username: string, jar?: CookieJar, query = "") =>
    JSON.parse(await readText(`/api/users/${username}/diary${query}`, jar)) as DiaryItemJson[];

  beforeAll(async () => {
    testServer = await startTestServer();
    [owner, follower, admin] = await Promise.all([
      signUpTestUser(baseUrl(), "ntown"),
      signUpTestUser(baseUrl(), "ntfan"),
      signUpTestUser(baseUrl(), "ntadm"),
    ]);
    await promoteToAdmin(admin.username);
    await client.send(follower.jar, "POST", `/api/social/follow/${owner.username}`);
  });

  afterAll(async () => {
    await testServer?.close();
    testServer = null;
  });

  it("saves a normalized note and tags with a new log and returns them to the owner", async () => {
    const title = await media.seed();
    const created = await client.log(owner.jar, title.tmdbId, {
      watchedDate: "2026-03-01",
      note: "  first time at the drive-in  ",
      tags: ["Cinema", " with   Mom", "cinema"],
    });
    expect(created.note).toBe("first time at the drive-in");
    expect(created.tags).toEqual(["cinema", "with mom"]);

    const own = (await client.send(owner.jar, "GET", media.logPath(created.entry.id))) as {
      note: string | null;
      tags: string[];
    };
    expect(own.note).toBe("first time at the drive-in");
    expect([...own.tags].sort()).toEqual(["cinema", "with mom"]);
  });

  it("edits the note and replaces the tags; null clears the note", async () => {
    const title = await media.seed();
    const id = (await client.log(owner.jar, title.tmdbId, { watchedDate: "2026-03-02", note: "a", tags: ["one", "two"] }))
      .entry.id;

    const edited = await client.send(owner.jar, "PUT", media.logPath(id), { note: "b", tags: ["two", "three"] });
    expect(edited.note).toBe("b");
    expect(edited.tags).toEqual(["two", "three"]);

    // A rating-only edit leaves note and tags as they were.
    const untouched = await client.send(owner.jar, "PUT", media.logPath(id), { rating: 7 });
    expect(untouched.note).toBe("b");
    expect([...(untouched.tags as string[])].sort()).toEqual(["three", "two"]);

    const cleared = await client.send(owner.jar, "PUT", media.logPath(id), { note: null, tags: [] });
    expect(cleared.note).toBeNull();
    expect(cleared.tags).toEqual([]);
  });

  it("rejects more than 10 tags and invalid tags", async () => {
    const title = await media.seed();
    const tooMany = Array.from({ length: 11 }, (_, index) => `tag${index}`);
    const overLimit = await client.request(owner.jar, "POST", media.createPath(title.tmdbId), media.createBody(title.tmdbId, {
      watchedDate: "2026-03-03",
      tags: tooMany,
    }));
    expect(overLimit.status).toBe(400);

    const invalid = await client.request(owner.jar, "POST", media.createPath(title.tmdbId), media.createBody(title.tmdbId, {
      watchedDate: "2026-03-03",
      tags: ["<script>"],
    }));
    expect(invalid.status).toBe(400);

    const longNote = await client.request(owner.jar, "POST", media.createPath(title.tmdbId), media.createBody(title.tmdbId, {
      watchedDate: "2026-03-03",
      note: "x".repeat(1001),
    }));
    expect(longNote.status).toBe(400);
  });

  it("never shows the note to anyone but its owner", async () => {
    const secret = `secret-${media.mediaType}-${crypto.randomUUID()}`;
    const title = await media.seed();
    const created = await client.log(owner.jar, title.tmdbId, {
      watchedDate: "2026-03-04",
      rating: 8,
      review: "A review written with the log",
      note: secret,
      tags: ["leakcheck"],
    });
    const reviewId = created.review?.id;
    expect(reviewId).toBeDefined();
    await waitForActivityWrite();

    const ownerDiary = await diaryOf(owner.username, owner.jar);
    expect(ownerDiary.find((item) => item.id === created.entry.id)?.note).toBe(secret);

    const titlePath = media.mediaType === "movie" ? "movies" : "serials";
    const nonOwnerReads: [string, CookieJar | undefined][] = [
      [`/api/users/${owner.username}/diary`, undefined],
      [`/api/users/${owner.username}/diary`, follower.jar],
      [`/api/users/${owner.username}/diary?tag=leakcheck`, follower.jar],
      [`/api/users/${owner.username}/recent/grouped`, follower.jar],
      [`/api/users/${owner.username}/reviews/${reviewId}`, undefined],
      [`/api/users/${owner.username}/reviews/${reviewId}`, follower.jar],
      [`/api/public/${owner.username}/diary`, undefined],
      [`/api/public/${owner.username}/recent`, undefined],
      [`/api/public/${owner.username}/activity`, undefined],
      [`/api/public/${owner.username}/reviews`, undefined],
      ["/api/social/feed/grouped", follower.jar],
      [`/api/${titlePath}/${title.tmdbId}/logs`, follower.jar],
      [`/api/${titlePath}/${title.tmdbId}/reviews`, follower.jar],
      [`/api/admin/diary?username=${owner.username}&mediaType=${media.mediaType}`, admin.jar],
    ];
    for (const [path, jar] of nonOwnerReads) {
      const body = await readText(path, jar);
      expect({ path, leaked: body.includes(secret) }).toEqual({ path, leaked: false });
    }

    // Another user can't read the log through the owner endpoint either.
    const foreign = await client.request(follower.jar, "GET", media.logPath(created.entry.id));
    expect(foreign.status).toBe(404);

    const activities = await diaryActivitiesOf(owner.username);
    expect(JSON.stringify(activities)).not.toContain(secret);

    // Tags are public: the follower sees them, without a note key at all.
    const publicItem = (await diaryOf(owner.username, follower.jar)).find((item) => item.id === created.entry.id);
    expect(publicItem?.tags).toEqual(["leakcheck"]);
    expect(publicItem && "note" in publicItem).toBe(false);
  });
});

describe("profile diary tag filter and tag counts", () => {
  let testServer: RunningTestServer | null = null;
  const baseUrl = () => {
    if (!testServer) throw new Error("Test server is not running");
    return testServer.baseUrl;
  };
  const [film, series] = WATCH_LOG_MEDIA.map((media) => watchLogClient(baseUrl, media)) as [
    ReturnType<typeof watchLogClient>,
    ReturnType<typeof watchLogClient>,
  ];

  beforeAll(async () => {
    testServer = await startTestServer();
  });

  afterAll(async () => {
    await testServer?.close();
    testServer = null;
  });

  const read = async <T>(path: string) => {
    const response = await apiRequest(baseUrl(), path);
    expect(response.status).toBe(200);
    return (await response.json()) as T;
  };

  it("filters the merged diary by tag across Films and Series and keeps paging", async () => {
    const { jar, username } = await signUpTestUser(baseUrl(), "ntfilter");
    const [filmMedia, seriesMedia] = WATCH_LOG_MEDIA as [(typeof WATCH_LOG_MEDIA)[0], (typeof WATCH_LOG_MEDIA)[0]];
    const tagged: string[] = [];
    for (let day = 1; day <= 5; day += 1) {
      const media = day % 2 === 0 ? seriesMedia : filmMedia;
      const client = day % 2 === 0 ? series : film;
      const title = await media.seed();
      const created = await client.log(jar, title.tmdbId, {
        watchedDate: `2026-04-0${day}`,
        tags: day === 3 ? ["other"] : ["cinema", "other"],
      });
      if (day !== 3) tagged.push(created.entry.id);
    }
    const untagged = await filmMedia.seed();
    await film.log(jar, untagged.tmdbId, { watchedDate: "2026-04-09" });

    // Newest watched first: days 5, 4, 2, 1.
    const expected = [...tagged].reverse();
    const all = await read<DiaryItemJson[]>(`/api/users/${username}/diary?tag=Cinema`);
    expect(all.map((item) => item.id)).toEqual(expected);
    expect(all.every((item) => item.tags.includes("cinema"))).toBe(true);
    expect(new Set(all.map((item) => item.mediaType))).toEqual(new Set(["movie", "tv"]));

    const firstPage = await read<DiaryItemJson[]>(`/api/users/${username}/diary?tag=cinema&limit=2&offset=0`);
    const secondPage = await read<DiaryItemJson[]>(`/api/users/${username}/diary?tag=cinema&limit=2&offset=2`);
    expect([...firstPage, ...secondPage].map((item) => item.id)).toEqual(expected);

    expect(await read<DiaryItemJson[]>(`/api/users/${username}/diary?tag=${encodeURIComponent("<nope>")}`)).toEqual([]);
    expect(await read<DiaryItemJson[]>(`/api/users/${username}/diary?tag=missing`)).toEqual([]);

    const counts = await read<{ tag: string; count: number }[]>(`/api/users/${username}/diary/tags`);
    expect(counts).toEqual([
      { tag: "other", count: 5 },
      { tag: "cinema", count: 4 },
    ]);
    expect(await read<unknown[]>(`/api/users/${username}/diary/tags?limit=1`)).toHaveLength(1);
  });

  it("drops a deleted log's tags from the counts", async () => {
    const { jar, username } = await signUpTestUser(baseUrl(), "ntdelete");
    const title = await WATCH_LOG_MEDIA[0]!.seed();
    const id = (await film.log(jar, title.tmdbId, { watchedDate: "2026-04-10", tags: ["gone"] })).entry.id;
    await film.send(jar, "DELETE", `/api/diary/${id}`);
    expect(await read<unknown[]>(`/api/users/${username}/diary/tags`)).toEqual([]);
  });
});
