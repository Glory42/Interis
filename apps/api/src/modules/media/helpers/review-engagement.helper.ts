// The review-engagement pipeline shared by the movie and serial detail
// pages: take a set of review ids, fetch their like counts and the viewer's
// own likes in one round, index both for O(1) lookup, and sort the built
// review items the same way on both pages. Previously copy-pasted between
// movies-detail.service.ts and serials-detail.service.ts, the sort block
// byte-for-byte.

export type ReviewLikeCountRow = { reviewId: string; likeCount: number };
export type ViewerLikedReviewRow = { reviewId: string };

// The two repository methods this needs, duck-typed so either
// MoviesReviewsRepository or SerialsReviewsRepository satisfies it.
export type ReviewLikeSource = {
  getReviewLikeCounts: (reviewIds: string[]) => Promise<ReviewLikeCountRow[]>;
  getViewerLikedReviewRows: (
    viewerUserId: string,
    reviewIds: string[],
  ) => Promise<ViewerLikedReviewRow[]>;
};

export type ReviewEngagementIndex = {
  likeCountByReviewId: Map<string, number>;
  viewerLikedReviewIds: Set<string>;
  likeCountFor: (reviewId: string) => number;
  viewerHasLiked: (reviewId: string) => boolean;
};

export const loadReviewEngagement = async (
  source: ReviewLikeSource,
  reviewIds: string[],
  viewerUserId: string | null,
): Promise<ReviewEngagementIndex> => {
  const [likeRows, viewerLikedRows] = await Promise.all([
    source.getReviewLikeCounts(reviewIds),
    viewerUserId
      ? source.getViewerLikedReviewRows(viewerUserId, reviewIds)
      : Promise.resolve([] as ViewerLikedReviewRow[]),
  ]);

  const likeCountByReviewId = new Map<string, number>(
    likeRows.map((likeRow) => [likeRow.reviewId, likeRow.likeCount]),
  );
  const viewerLikedReviewIds = new Set<string>(
    viewerLikedRows.map((likedRow) => likedRow.reviewId),
  );

  return {
    likeCountByReviewId,
    viewerLikedReviewIds,
    likeCountFor: (reviewId) => likeCountByReviewId.get(reviewId) ?? 0,
    viewerHasLiked: (reviewId) => viewerLikedReviewIds.has(reviewId),
  };
};

export type SortableReviewItem = { likeCount: number; createdAt: Date };

// "popular" ranks by like count, newest-first as the tie-break; anything
// else is a plain newest-first ordering. Stable copy - never mutates the
// input.
export const sortReviewsByEngagement = <T extends SortableReviewItem>(
  items: T[],
  sort: string,
): T[] => {
  const sorted = [...items];

  if (sort === "popular") {
    sorted.sort((leftReview, rightReview) => {
      if (rightReview.likeCount !== leftReview.likeCount) {
        return rightReview.likeCount - leftReview.likeCount;
      }

      return rightReview.createdAt.getTime() - leftReview.createdAt.getTime();
    });

    return sorted;
  }

  sorted.sort(
    (leftReview, rightReview) =>
      rightReview.createdAt.getTime() - leftReview.createdAt.getTime(),
  );

  return sorted;
};
