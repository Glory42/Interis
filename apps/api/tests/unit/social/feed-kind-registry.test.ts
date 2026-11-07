import { describe, expect, it } from "bun:test";
import { FEED_KINDS } from "../../../src/modules/social/helpers/feed-kinds/feed-kind.registry";
import { emptyFeedIds } from "../../../src/modules/social/helpers/social-feed-context.helper";
import { parseActivity } from "../../../src/modules/social/helpers/social-feed-item.helper";
import type { ActivityType } from "../../../src/modules/social/types/social-feed.types";
import type { FeedContext, ParsedActivity } from "../../../src/modules/social/types/social-feed-kind.types";

// Rows only older versions wrote, which no HTTP flow can produce any more.

const parse = (type: ActivityType, entityId: string, metadata: Record<string, unknown>): ParsedActivity =>
  parseActivity({
    activity: {
      id: "activity-1",
      userId: "actor-1",
      type,
      entityId,
      metadata: JSON.stringify(metadata),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    },
    actorId: "actor-1",
    actorUsername: "actor",
    actorDisplayUsername: null,
    actorAvatarUrl: null,
  });

const emptyContext = (): FeedContext => ({
  reviews: { byReviewId: new Map(), byDiaryEntryId: new Map() },
  posts: new Map(),
  postEngagement: new Map(),
  films: new Map(),
  logs: new Map(),
  lists: new Map(),
  users: new Map(),
  reviewComments: new Map(),
  postComments: new Map(),
  activityEngagement: new Map(),
});

describe("Following Feed kind registry", () => {
  it("loads the film of a like recorded without it by the row's own id", () => {
    const parsed = parse("liked_movie", "42", {});
    const kind = FEED_KINDS[parsed.kind];
    const ids = emptyFeedIds();
    kind.collect(parsed, ids);
    expect([...ids.films]).toEqual([42]);
    expect([...ids.likedActivities]).toEqual(["activity-1"]);

    const context = emptyContext();
    context.films.set(42, { id: 42, tmdbId: 603, title: "The Matrix", posterPath: null, releaseYear: 1999 });
    expect(kind.isDead(parsed, context)).toBe(false);
    expect(kind.project(parsed, context).movie).toEqual({
      tmdbId: 603,
      title: "The Matrix",
      posterPath: null,
      releaseYear: 1999,
      mediaType: "movie",
    });
  });

  it("treats a legacy comment like as a like that goes with its review", () => {
    const reviewId = "0b0f7a52-4f1e-4d55-9d4f-8a8d3f3b2c11";
    const parsed = parse("commented", "c", { action: "liked_comment", reviewId });
    const kind = FEED_KINDS[parsed.kind];
    expect(parsed.kind).toBe("liked_comment");
    expect(kind.isLike).toBe(true);

    const ids = emptyFeedIds();
    kind.collect(parsed, ids);
    expect([...ids.reviews]).toEqual([reviewId]);
    expect(kind.isDead(parsed, emptyContext())).toBe(true);
  });

  it("never asks the database for ids that can't exist, and drops their rows", () => {
    const context = emptyContext();
    for (const parsed of [
      parse("diary_entry", "not-a-uuid", {}),
      parse("review", "not-a-uuid", {}),
      parse("created_list", "not-a-uuid", {}),
      parse("commented", "not-a-uuid", { action: "commented_post", postId: "also-not-a-uuid" }),
    ]) {
      const ids = emptyFeedIds();
      FEED_KINDS[parsed.kind].collect(parsed, ids);
      const requested = [ids.reviews, ids.logs, ids.posts, ids.lists, ids.reviewComments, ids.postComments];
      expect(requested.every((set) => set.size === 0)).toBe(true);
      expect(FEED_KINDS[parsed.kind].isDead(parsed, context)).toBe(true);
    }
  });
});
