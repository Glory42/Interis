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
