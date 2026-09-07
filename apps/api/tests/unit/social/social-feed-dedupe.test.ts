import { describe, expect, it } from "bun:test";
import { dedupeReviewFeedItems } from "../../../src/modules/social/helpers/social-feed-dedupe.helper";
import type { FeedItem } from "../../../src/modules/social/types/social-feed.types";

type Overrides = {
  id: string;
  kind: FeedItem["kind"];
  actorId?: string;
  reviewId?: string | null;
};

const makeItem = ({ id, kind, actorId = "actor-1", reviewId = null }: Overrides): FeedItem =>
  ({
    id,
    type: "diary_entry",
    kind,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    actor: { id: actorId, username: "u", displayUsername: null, avatarUrl: null },
    movie: null,
    post: null,
    review:
      reviewId === null
        ? null
        : { id: reviewId, content: "c", containsSpoilers: false, rating: null },
    metadata: {} as FeedItem["metadata"],
    engagement: { likeCount: 0, commentCount: 0, viewerHasLiked: null },
  }) as FeedItem;

describe("dedupeReviewFeedItems", () => {
  it("keeps items that carry no review", () => {
    const items = [
      makeItem({ id: "1", kind: "followed_user" }),
      makeItem({ id: "2", kind: "liked_movie" }),
    ];
    expect(dedupeReviewFeedItems(items).map((i) => i.id)).toEqual(["1", "2"]);
  });

  it("keeps a review-bearing item when it is the only one for that key", () => {
    const items = [makeItem({ id: "1", kind: "review", reviewId: "rev-1" })];
    expect(dedupeReviewFeedItems(items)).toHaveLength(1);
  });

  it("collapses a review + diary_entry pair for the same actor+review, preferring the diary entry", () => {
    const items = [
      makeItem({ id: "review-item", kind: "review", reviewId: "rev-1" }),
      makeItem({ id: "diary-item", kind: "diary_entry", reviewId: "rev-1" }),
    ];
    const result = dedupeReviewFeedItems(items);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("diary-item");
  });

  it("preserves original ordering of the surviving items", () => {
    const items = [
      makeItem({ id: "diary-item", kind: "diary_entry", reviewId: "rev-1" }),
      makeItem({ id: "other", kind: "followed_user" }),
      makeItem({ id: "review-item", kind: "review", reviewId: "rev-1" }),
    ];
    expect(dedupeReviewFeedItems(items).map((i) => i.id)).toEqual(["diary-item", "other"]);
  });

  it("does not collapse the same review id across different actors", () => {
    const items = [
      makeItem({ id: "a", kind: "review", reviewId: "rev-1", actorId: "actor-1" }),
      makeItem({ id: "b", kind: "diary_entry", reviewId: "rev-1", actorId: "actor-2" }),
    ];
    expect(dedupeReviewFeedItems(items)).toHaveLength(2);
  });

  it("does not collapse two diary entries that share nothing but a null review", () => {
    const items = [
      makeItem({ id: "a", kind: "diary_entry", reviewId: null }),
      makeItem({ id: "b", kind: "diary_entry", reviewId: null }),
    ];
    expect(dedupeReviewFeedItems(items)).toHaveLength(2);
  });

  it("keeps the first item when both candidates are the same kind", () => {
    const items = [
      makeItem({ id: "first", kind: "review", reviewId: "rev-1" }),
      makeItem({ id: "second", kind: "review", reviewId: "rev-1" }),
    ];
    const result = dedupeReviewFeedItems(items);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("first");
  });
});
