import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FeedItem } from "@/features/feed/types";
import { feedKeys } from "@/features/feed/hooks/useFeed";
import { patchFeedItems } from "@/features/feed/hooks/feed-cache.helper";
import { restoreQueries, type QuerySnapshot } from "@/lib/query-optimistic";
import {
  addReviewComment,
  getProfileReviewDetail,
  getReviewComments,
  likeReview,
  type ReviewComment,
  type ReviewDetail,
  type ReviewMediaType,
  updateReview,
  unlikeReview,
} from "@/features/reviews/api";

export const reviewKeys = {
  detail: (username: string, reviewId: string) =>
    ["reviews", "detail", username, reviewId] as const,
  comments: (mediaType: ReviewMediaType, reviewId: string) =>
    ["reviews", "comments", mediaType, reviewId] as const,
};

const matchesReview = (item: FeedItem, reviewId: string): boolean => {
  return item.review?.id === reviewId || item.metadata.reviewId === reviewId;
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
    queryKey: ["reviews", "detail"],
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

      patchFeedItems(
        queryClient,
        (item) => matchesReview(item, reviewId),
        (item) => ({
          ...item,
          engagement: {
            ...item.engagement,
            commentCount: item.engagement.commentCount + 1,
          },
        }),
      );

      patchReviewDetailQueries(queryClient, reviewId, (detail) => ({
        ...detail,
        engagement: {
          ...detail.engagement,
          commentCount: detail.engagement.commentCount + 1,
        },
      }));

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: reviewKeys.comments(mediaType, reviewId) }),
        queryClient.invalidateQueries({ queryKey: feedKeys.following }),
      ]);
    },
  });
};

export const useLikeReview = (reviewId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => likeReview(reviewId),
    onMutate: async () => {
      const previousFeedQueries = patchFeedItems(
        queryClient,
        (item) => matchesReview(item, reviewId),
        (item) => ({
          ...item,
          engagement: {
            ...item.engagement,
            viewerHasLiked: true,
            likeCount: item.engagement.viewerHasLiked
              ? item.engagement.likeCount
              : item.engagement.likeCount + 1,
          },
        }),
      );

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
      restoreQueries(queryClient, context?.previousFeedQueries ?? []);
      restoreQueries(queryClient, context?.previousDetailQueries ?? []);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: feedKeys.following });
    },
  });
};

export const useUnlikeReview = (reviewId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => unlikeReview(reviewId),
    onMutate: async () => {
      const previousFeedQueries = patchFeedItems(
        queryClient,
        (item) => matchesReview(item, reviewId),
        (item) => ({
          ...item,
          engagement: {
            ...item.engagement,
            viewerHasLiked: false,
            likeCount: item.engagement.viewerHasLiked
              ? Math.max(item.engagement.likeCount - 1, 0)
              : item.engagement.likeCount,
          },
        }),
      );

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
      restoreQueries(queryClient, context?.previousFeedQueries ?? []);
      restoreQueries(queryClient, context?.previousDetailQueries ?? []);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: feedKeys.following });
    },
  });
};

export const useUpdateReview = (reviewId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { content: string; containsSpoilers?: boolean }) =>
      updateReview(reviewId, input),
    onSuccess: async (updatedReview) => {
      patchFeedItems(
        queryClient,
        (item) => matchesReview(item, reviewId),
        (item) => ({
          ...item,
          review: item.review
            ? {
                ...item.review,
                content: updatedReview.content,
                containsSpoilers: updatedReview.containsSpoilers,
              }
            : item.review,
          metadata: {
            ...item.metadata,
            excerpt: updatedReview.content,
            containsSpoilers: updatedReview.containsSpoilers,
          },
        }),
      );

      patchReviewDetailQueries(queryClient, reviewId, (detail) => ({
        ...detail,
        content: updatedReview.content,
        containsSpoilers: updatedReview.containsSpoilers,
        updatedAt: updatedReview.updatedAt,
      }));

      await queryClient.invalidateQueries({ queryKey: feedKeys.following });
    },
  });
};
