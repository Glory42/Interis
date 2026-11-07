import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateFollowingFeed, patchFeed, restoreFeed } from "@/features/feed/hooks/feed-cache";
import { restoreQueries, type QuerySnapshot } from "@/lib/query-optimistic";
import {
  addReviewComment,
  deleteReviewComment,
  getMyTitleReviews,
  getProfileReviewDetail,
  getReviewComments,
  likeReview,
  type MyTitleReviewsQuery,
  type ReviewComment,
  type ReviewDetail,
  type ReviewMediaType,
  updateReview,
  updateReviewComment,
  unlikeReview,
} from "@/features/reviews/api";

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

// Loads the viewer's reviews of a title on demand (when they open the review
// chooser) rather than on every detail-page view; staleTime 0 so a review
// written a moment ago is always listed.
export const useFetchMyTitleReviews = () => {
  const queryClient = useQueryClient();

  return (query: MyTitleReviewsQuery) =>
    queryClient.fetchQuery({
      queryKey: reviewKeys.mineForTitle(query),
      queryFn: () => getMyTitleReviews(query),
      staleTime: 0,
    });
};

// Patches every cached "review detail" query for this reviewId (there can be
// more than one cached, e.g. after navigating between profile review pages)
// and returns a snapshot for rollback.
const patchReviewDetailQueries = (
  queryClient: QueryClient,
  reviewId: string,
  updater: (detail: ReviewDetail) => ReviewDetail,
): QuerySnapshot => {
  const queryFilter = {
    queryKey: reviewKeys.detailRoot,
    exact: false,
    predicate: (query: { queryKey: readonly unknown[] }) => {
      const [scope, kind, , candidateReviewId] = query.queryKey;
      return scope === "reviews" && kind === "detail" && candidateReviewId === reviewId;
    },
  } as const;

  const previousQueries = queryClient.getQueriesData<ReviewDetail>(queryFilter);

  queryClient.setQueriesData<ReviewDetail>(queryFilter, (currentDetail) =>
    currentDetail ? updater(currentDetail) : currentDetail,
  );

  return previousQueries;
};

export const useReviewDetail = (username: string, reviewId: string, enabled = true) => {
  return useQuery({
    queryKey: reviewKeys.detail(username, reviewId),
    queryFn: ({ signal }) => getProfileReviewDetail(username, reviewId, { signal }),
    enabled,
  });
};

export const useReviewComments = (
  reviewId: string,
  mediaType: ReviewMediaType,
  enabled = true,
) => {
  return useQuery({
    queryKey: reviewKeys.comments(mediaType, reviewId),
    queryFn: () => getReviewComments(reviewId),
    enabled,
  });
};

export const useAddReviewComment = (reviewId: string, mediaType: ReviewMediaType) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { content: string }) => addReviewComment(reviewId, input),
    onSuccess: async (createdComment) => {
      queryClient.setQueryData<ReviewComment[]>(
        reviewKeys.comments(mediaType, reviewId),
        (currentComments) => {
          if (!currentComments) {
            return [createdComment];
          }

          const hasComment = currentComments.some(
            (comment) => comment.id === createdComment.id,
          );

          if (hasComment) {
            return currentComments;
          }

          return [...currentComments, createdComment];
        },
      );

      await patchFeed(queryClient, { review: reviewId }, { type: "comment-added" });

      patchReviewDetailQueries(queryClient, reviewId, (detail) => ({
        ...detail,
        engagement: {
          ...detail.engagement,
          commentCount: detail.engagement.commentCount + 1,
        },
      }));

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: reviewKeys.comments(mediaType, reviewId) }),
        invalidateFollowingFeed(queryClient),
      ]);
    },
  });
};

export const useUpdateReviewComment = (reviewId: string, mediaType: ReviewMediaType) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { commentId: string; content: string }) =>
      updateReviewComment(input.commentId, { content: input.content }),
    onSuccess: async (updatedComment) => {
      queryClient.setQueryData<ReviewComment[]>(
        reviewKeys.comments(mediaType, reviewId),
        (currentComments) =>
          currentComments?.map((comment) =>
            comment.id === updatedComment.id ? updatedComment : comment,
          ) ?? currentComments,
      );
      // The feed quotes the comment, so its card must pick up the new text.
      await patchFeed(queryClient, { comment: updatedComment.id }, {
        type: "comment-edited",
        content: updatedComment.content,
      });
      await invalidateFollowingFeed(queryClient);
    },
  });
};

export const useDeleteReviewComment = (reviewId: string, mediaType: ReviewMediaType) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => deleteReviewComment(commentId),
    onSuccess: async (_data, commentId) => {
      queryClient.setQueryData<ReviewComment[]>(
        reviewKeys.comments(mediaType, reviewId),
        (currentComments) => currentComments?.filter((comment) => comment.id !== commentId),
      );

      await patchFeed(queryClient, { review: reviewId }, { type: "comment-removed" });

      patchReviewDetailQueries(queryClient, reviewId, (detail) => ({
        ...detail,
        engagement: {
          ...detail.engagement,
          commentCount: Math.max(detail.engagement.commentCount - 1, 0),
        },
      }));

      await invalidateFollowingFeed(queryClient);
    },
  });
};

export const useLikeReview = (reviewId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { errorToast: "Couldn't like this review" },
    mutationFn: () => likeReview(reviewId),
    onMutate: async () => {
      const previousFeedQueries = await patchFeed(queryClient, { review: reviewId }, { type: "liked" });

      const previousDetailQueries = patchReviewDetailQueries(queryClient, reviewId, (detail) => ({
        ...detail,
        engagement: {
          ...detail.engagement,
          viewerHasLiked: true,
          likeCount: detail.engagement.viewerHasLiked
            ? detail.engagement.likeCount
            : detail.engagement.likeCount + 1,
        },
      }));

      return { previousFeedQueries, previousDetailQueries };
    },
    onError: (_error, _variables, context) => {
      restoreFeed(queryClient, context?.previousFeedQueries);
      restoreQueries(queryClient, context?.previousDetailQueries ?? []);
    },
    onSettled: async () => {
      await invalidateFollowingFeed(queryClient);
    },
  });
};

export const useUnlikeReview = (reviewId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { errorToast: "Couldn't unlike this review" },
    mutationFn: () => unlikeReview(reviewId),
    onMutate: async () => {
      const previousFeedQueries = await patchFeed(queryClient, { review: reviewId }, { type: "unliked" });

      const previousDetailQueries = patchReviewDetailQueries(queryClient, reviewId, (detail) => ({
        ...detail,
        engagement: {
          ...detail.engagement,
          viewerHasLiked: false,
          likeCount: detail.engagement.viewerHasLiked
            ? Math.max(detail.engagement.likeCount - 1, 0)
            : detail.engagement.likeCount,
        },
      }));

      return { previousFeedQueries, previousDetailQueries };
    },
    onError: (_error, _variables, context) => {
      restoreFeed(queryClient, context?.previousFeedQueries);
      restoreQueries(queryClient, context?.previousDetailQueries ?? []);
    },
    onSettled: async () => {
      await invalidateFollowingFeed(queryClient);
    },
  });
};

export const useUpdateReview = (reviewId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { content: string; containsSpoilers?: boolean }) =>
      updateReview(reviewId, input),
    onSuccess: async (updatedReview) => {
      await patchFeed(queryClient, { review: reviewId }, {
        type: "review-edited",
        content: updatedReview.content,
        containsSpoilers: updatedReview.containsSpoilers,
      });

      patchReviewDetailQueries(queryClient, reviewId, (detail) => ({
        ...detail,
        content: updatedReview.content,
        containsSpoilers: updatedReview.containsSpoilers,
        updatedAt: updatedReview.updatedAt,
      }));

      await invalidateFollowingFeed(queryClient);
    },
  });
};
