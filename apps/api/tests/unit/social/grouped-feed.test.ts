import { describe, expect, it } from "bun:test";
import {
  GroupedFeedService,
  type GroupedFeedPage,
  type GroupedFeedSource,
} from "../../../src/modules/social/services/grouped-feed.service";
import type { ActivityRow, FeedItem, FeedMetadata, FeedRow } from "../../../src/modules/social/types/social-feed.types";

const ISTANBUL = "Europe/Istanbul";

const emptyMetadata: FeedMetadata = {
  action: null, excerpt: null, targetUsername: null, rating: null, rewatch: null, hasReview: null,
  mediaType: null, containsSpoilers: null, reviewId: null, commentId: null, movieId: null, postId: null,
  postMediaId: null, postMediaType: null, seasonNumber: null, episodeNumber: null, listId: null,
  listTitle: null, logId: null, watchedDate: null,
};

type ItemInput = {
  id: string;
  kind: FeedItem["kind"];
  at: string;
  actor?: string;
  tmdbId?: number;
  mediaType?: "movie" | "tv";
  metadata?: Partial<FeedMetadata>;
};

const item = ({ id, kind, at, actor = "ana", tmdbId, mediaType = "movie", metadata = {} }: ItemInput): FeedItem => ({
  id,
  type: kind === "liked_post" || kind === "liked_comment" || kind === "commented_post" ? "post" : kind,
  kind,
  createdAt: new Date(at),
  actor: { id: `id-${actor}`, username: actor, displayUsername: null, avatarUrl: null },
  movie: tmdbId === undefined ? null : { tmdbId, title: `Title ${tmdbId}`, posterPath: null, releaseYear: 2020, mediaType },
  post: null,
  review: null,
  metadata: { ...emptyMetadata, ...metadata },
  engagement: { likeCount: 0, commentCount: 0, viewerHasLiked: null },
});

const like = (id: string, tmdbId: number, at: string, actor?: string) => item({ id, kind: "liked_movie", at, tmdbId, actor });
const watchlist = (id: string, tmdbId: number, at: string) => item({ id, kind: "watchlisted_movie", at, tmdbId });
const follow = (id: string, target: string, at: string) => item({ id, kind: "followed_user", at, metadata: { targetUsername: target } });
const log = (id: string, tmdbId: number, at: string, metadata: Partial<FeedMetadata> = {}) =>
  item({ id, kind: "diary_entry", at, tmdbId, metadata });
const episode = (id: string, at: string, episodeNumber: number, rating: number | null = null) =>
  item({ id, kind: "diary_entry", at, tmdbId: 900, mediaType: "tv", metadata: { seasonNumber: 1, episodeNumber, rating } });

// An in-memory source over items (newest first), each standing for one activity row.
const sourceOf = (items: FeedItem[], paged = true): GroupedFeedSource => {
  const rows: ActivityRow[] = items.map((feedItem) => ({
    activity: { id: feedItem.id, userId: feedItem.actor.id, type: feedItem.type, entityId: feedItem.id, metadata: null, createdAt: feedItem.createdAt },
    actorId: feedItem.actor.id,
    actorUsername: feedItem.actor.username,
    actorDisplayUsername: null,
    actorAvatarUrl: null,
  }));
  const byId = new Map(items.map((feedItem) => [feedItem.id, feedItem]));
  return {
    paged,
    readRows: async (limit, cursor) => {
      const start = cursor ? rows.findIndex((row) => row.activity.id === cursor.id) + 1 : 0;
      return rows.slice(start, start + limit);
    },
    toItems: async (window) => window.flatMap((row) => byId.get(row.activity.id) ?? []),
  };
};

const read = (items: FeedItem[], options: { limit?: number; timeZone?: string; cursor?: string; mediaType?: "movie" | "tv" } = {}) =>
  GroupedFeedService.readPage(sourceOf(items), { timeZone: "UTC", ...options });

const readAll = async (items: FeedItem[], limit: number, timeZone = "UTC"): Promise<GroupedFeedPage[]> => {
  const pages: GroupedFeedPage[] = [];
  let cursor: string | undefined;
  do {
    const page = await read(items, { limit, cursor, timeZone });
    pages.push(page);
    cursor = page.nextCursor ?? undefined;
  } while (cursor && pages.length < 20);
  return pages;
};

const shape = (rows: FeedRow[]) => rows.map((row) => `${row.day} ${row.kind}`);

describe("GroupedFeedService.readPage", () => {
  it("folds one person's same-day runs of likes, watchlist adds and follows into one row each", async () => {
    const { rows } = await read([
      like("l1", 1, "2026-11-02T12:05:00Z"),
      like("l2", 2, "2026-11-02T12:04:00Z"),
      watchlist("w1", 3, "2026-11-02T12:03:00Z"),
      watchlist("w2", 4, "2026-11-02T12:02:00Z"),
      follow("f1", "bo", "2026-11-02T12:01:00Z"),
      follow("f2", "cy", "2026-11-02T12:00:00Z"),
    ]);

    expect(rows).toMatchObject([
      { kind: "titles", action: "liked", day: "2026-11-02", key: "l1+l2", titles: [{ tmdbId: 1 }, { tmdbId: 2 }] },
      { kind: "titles", action: "watchlisted", titles: [{ tmdbId: 3 }, { tmdbId: 4 }] },
      { kind: "follows", usernames: ["bo", "cy"] },
    ]);
  });

  it("keeps a run of one, another person's like, and a logged title as their own rows", async () => {
    const { rows } = await read([
      like("l1", 1, "2026-11-02T12:03:00Z"),
      like("l2", 2, "2026-11-02T12:02:00Z", "bo"),
      log("d1", 3, "2026-11-02T12:01:00Z", { rating: 8 }),
      follow("f1", "cy", "2026-11-02T12:00:00Z"),
    ]);

    expect(rows.map((row) => row.kind)).toEqual(["title", "title", "title", "activity"]);
  });

  it("folds one show's episodes into one row, merging each episode's actions", async () => {
    const { rows } = await read([
      episode("e3", "2026-11-02T12:03:00Z", 3),
      episode("e2", "2026-11-02T12:02:00Z", 2, 7),
      episode("e1", "2026-11-02T12:01:00Z", 1),
      like("l1", 1, "2026-11-02T12:00:00Z"),
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ kind: "episodes", movie: { tmdbId: 900 } });
    const episodes = rows[0]!.kind === "episodes" ? rows[0]!.groups : [];
    expect(episodes.map((group) => [group.episodeNumber, group.rating])).toEqual([[3, null], [2, 7], [1, null]]);
  });

  it("drops likes of the actor's own content", async () => {
    const ownLike = item({ id: "lr", kind: "liked_review", at: "2026-11-02T12:01:00Z", metadata: { targetUsername: "ana" } });
    const otherLike = item({ id: "lr2", kind: "liked_review", at: "2026-11-02T12:00:00Z", metadata: { targetUsername: "bo" } });

    const { rows } = await read([ownLike, otherLike]);
    expect(rows.map((row) => row.key)).toEqual(["lr2"]);
  });

  it("keeps only films or only TV, folding what's left", async () => {
    const items = [
      like("l1", 1, "2026-11-02T12:04:00Z"),
      episode("e1", "2026-11-02T12:03:00Z", 1),
      like("l2", 2, "2026-11-02T12:02:00Z"),
      follow("f1", "bo", "2026-11-02T12:01:00Z"),
    ];

    expect((await read(items, { mediaType: "movie" })).rows).toMatchObject([{ kind: "titles", key: "l1+l2" }]);
    expect((await read(items, { mediaType: "tv" })).rows).toMatchObject([{ kind: "title", key: "e1" }]);
  });

  describe("days in the viewer's time zone", () => {
    // 22:30 and 00:30 UTC are 01:30 and 03:30 in Istanbul (UTC+3): one local day.
    const acrossUtcMidnight = [like("l1", 1, "2026-11-03T00:30:00Z"), like("l2", 2, "2026-11-02T22:30:00Z")];
    // 20:30 and 21:30 UTC are 23:30 and 00:30 in Istanbul: two local days.
    const acrossLocalMidnight = [like("l1", 1, "2026-11-02T21:30:00Z"), like("l2", 2, "2026-11-02T20:30:00Z")];

    it("folds a run that straddles UTC midnight but is one local day", async () => {
      expect(shape((await read(acrossUtcMidnight)).rows)).toEqual(["2026-11-03 title", "2026-11-02 title"]);
      expect(shape((await read(acrossUtcMidnight, { timeZone: ISTANBUL })).rows)).toEqual(["2026-11-03 titles"]);
    });

    it("splits a run that is one UTC day but straddles local midnight", async () => {
      expect(shape((await read(acrossLocalMidnight)).rows)).toEqual(["2026-11-02 titles"]);
      expect(shape((await read(acrossLocalMidnight, { timeZone: ISTANBUL })).rows)).toEqual([
        "2026-11-03 title",
        "2026-11-02 title",
      ]);
    });

    it("merges a title's log and like into one card per local day", async () => {
      const items = [like("l1", 1, "2026-11-03T00:30:00Z"), log("d1", 1, "2026-11-02T22:30:00Z")];

      expect((await read(items)).rows).toHaveLength(2);
      const [row] = (await read(items, { timeZone: ISTANBUL })).rows;
      expect(row).toMatchObject({ kind: "title", day: "2026-11-03", group: { watched: true, liked: true } });
    });
  });

  describe("pages", () => {
    const threeDays = [
      log("d3", 3, "2026-11-03T12:00:00Z"),
      like("l2a", 21, "2026-11-02T12:02:00Z"),
      log("d2", 22, "2026-11-02T12:01:00Z"),
      like("l2b", 23, "2026-11-02T12:00:00Z"),
      log("d1", 1, "2026-11-01T12:00:00Z"),
    ];

    it("keeps whole days until the limit, then resumes without repeating a row", async () => {
      const pages = await readAll(threeDays, 1);

      expect(pages.map((page) => shape(page.rows))).toEqual([
        ["2026-11-03 title"],
        ["2026-11-02 title", "2026-11-02 title", "2026-11-02 title"],
        ["2026-11-01 title"],
      ]);
      expect(pages.at(-1)!.nextCursor).toBeNull();
    });

    it("cuts by the viewer's days", async () => {
      // In Pacific/Kiritimati (UTC+14) 12:00 UTC is already the next day, so the days shift but stay whole.
      const pages = await readAll(threeDays, 1, "Pacific/Kiritimati");
      expect(pages.map((page) => page.rows.map((row) => row.day))).toEqual([
        ["2026-11-04"],
        ["2026-11-03", "2026-11-03", "2026-11-03"],
        ["2026-11-02"],
      ]);
    });

    it("ends mid-day only when one day fills the whole window", async () => {
      const logs = Array.from({ length: 130 }, (_, index) =>
        log(`d${index}`, index, new Date(Date.parse("2026-11-02T23:00:00Z") - index * 1000).toISOString()),
      );
      const pages = await readAll(logs, 5);

      expect(pages).toHaveLength(2);
      expect(pages[0]!.rows).toHaveLength(100);
      expect(pages.flatMap((page) => page.rows.map((row) => row.key))).toEqual(logs.map((entry) => entry.id));
    });

    it("leaves a day the window cut short for the next page", async () => {
      const logs = Array.from({ length: 101 }, (_, index) =>
        log(`d${index}`, index, new Date(Date.parse("2026-11-02T23:00:00Z") - index * 1000).toISOString()),
      );
      const page = await read([log("today", 999, "2026-11-03T08:00:00Z"), ...logs], { limit: 20 });

      expect(page.rows.map((row) => row.key)).toEqual(["today"]);
      expect(page.nextCursor).not.toBeNull();
    });

    it("gives an unpaged source its newest `limit` rows and no cursor", async () => {
      const page = await GroupedFeedService.readPage(sourceOf(threeDays, false), { limit: 2, timeZone: "UTC" });
      expect(page).toEqual({ rows: [expect.objectContaining({ key: "d3" }), expect.objectContaining({ key: "l2a" })], nextCursor: null });
    });
  });
});
