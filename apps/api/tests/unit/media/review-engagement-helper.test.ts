import { describe, expect, it } from "bun:test";
import {
  loadReviewEngagement,
  sortReviewsByEngagement,
  type ReviewLikeSource,
} from "../../../src/modules/media/helpers/review-engagement.helper";

const makeSource = (
  likeCounts: { reviewId: string; likeCount: number }[],
  viewerLiked: { reviewId: string }[],
): ReviewLikeSource & { viewerCalls: number } => {
  let viewerCalls = 0;
  return {
    get viewerCalls() {
      return viewerCalls;
    },
    getReviewLikeCounts: async () => likeCounts,
    getViewerLikedReviewRows: async () => {
      viewerCalls += 1;
      return viewerLiked;
    },
  };
};

describe("loadReviewEngagement", () => {
  it("indexes like counts and the viewer's likes for O(1) lookup", async () => {
    const source = makeSource(
      [
        { reviewId: "a", likeCount: 3 },
        { reviewId: "b", likeCount: 0 },
      ],
      [{ reviewId: "a" }],
    );

    const index = await loadReviewEngagement(source, ["a", "b", "c"], "viewer-1");

    expect(index.likeCountFor("a")).toBe(3);
    expect(index.likeCountFor("b")).toBe(0);
    expect(index.likeCountFor("c")).toBe(0); // unknown id -> 0
    expect(index.viewerHasLiked("a")).toBe(true);
    expect(index.viewerHasLiked("b")).toBe(false);
    expect(index.likeCountByReviewId).toBeInstanceOf(Map);
    expect(index.viewerLikedReviewIds).toBeInstanceOf(Set);
  });

  it("skips the viewer-liked query entirely when there is no viewer", async () => {
    const source = makeSource([{ reviewId: "a", likeCount: 1 }], [{ reviewId: "a" }]);

    const index = await loadReviewEngagement(source, ["a"], null);

    expect(source.viewerCalls).toBe(0);
    expect(index.viewerHasLiked("a")).toBe(false);
  });
});

describe("sortReviewsByEngagement", () => {
  const d = (iso: string) => new Date(iso);
  const items = [
    { id: "old-popular", likeCount: 5, createdAt: d("2026-01-01") },
    { id: "new-quiet", likeCount: 0, createdAt: d("2026-03-01") },
    { id: "mid", likeCount: 5, createdAt: d("2026-02-01") },
  ];

  it("popular: like count desc, newest-first as the tie-break", () => {
    const sorted = sortReviewsByEngagement(items, "popular").map((r) => r.id);
    expect(sorted).toEqual(["mid", "old-popular", "new-quiet"]);
  });

  it("recent (any non-popular value): newest-first", () => {
    const sorted = sortReviewsByEngagement(items, "recent").map((r) => r.id);
    expect(sorted).toEqual(["new-quiet", "mid", "old-popular"]);
  });

  it("does not mutate the input array", () => {
    const input = [...items];
    sortReviewsByEngagement(input, "popular");
    expect(input.map((r) => r.id)).toEqual(["old-popular", "new-quiet", "mid"]);
  });
});
