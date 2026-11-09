import type { MyTitleReviewsQuery, ReviewMediaType } from "@/features/reviews/api";

export const reviewKeys = {
  detail: (username: string, reviewId: string) =>
    ["reviews", "detail", username, reviewId] as const,
  // Prefix-only variant - used to filter/match every cached review-detail
  // query regardless of username, e.g. when patching by reviewId alone.
  detailRoot: ["reviews", "detail"] as const,
  comments: (mediaType: ReviewMediaType, reviewId: string) =>
    ["reviews", "comments", mediaType, reviewId] as const,
  mineForTitle: (query: MyTitleReviewsQuery) => ["reviews", "mine", query] as const,
};

// Every cached detail query of one review, whichever profile URL it was opened under.
export const reviewDetailFilter = (reviewId: string) =>
  ({
    queryKey: reviewKeys.detailRoot,
    exact: false,
    predicate: (query: { queryKey: readonly unknown[] }) => {
      const [scope, kind, , candidateReviewId] = query.queryKey;
      return scope === "reviews" && kind === "detail" && candidateReviewId === reviewId;
    },
  }) as const;
