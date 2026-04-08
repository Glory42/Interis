import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FeedItem } from "@/features/feed/types";
import { feedKeys } from "@/features/feed/hooks/useFeed";
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

const updateReviewInFeedCaches = (
  queryClient: QueryClient,
  reviewId: string,
  updater: (item: FeedItem) => FeedItem,
) => {
  queryClient.setQueriesData<FeedItem[]>(
    { queryKey: feedKeys.following, exact: false },
    (currentItems) => {
      if (!currentItems) {
        return currentItems;
      }

      return currentItems.map((item) =>
        matchesReview(item, reviewId) ? updater(item) : item,
      );
    },
  );
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

const updateReviewDetailCache = (
  queryClient: QueryClient,
  reviewId: string,
  updater: (detail: ReviewDetail) => ReviewDetail,
) => {
  queryClient.setQueriesData<ReviewDetail>(
    {
      queryKey: ["reviews", "detail"],
      exact: false,
      predicate: (query) => {
        const [scope, kind, candidateReviewId] = [
          query.queryKey[0],
          query.queryKey[1],
          query.queryKey[3],
        ];
        return scope === "reviews" && kind === "detail" && candidateReviewId === reviewId;
      },
    },
    (currentDetail) => {
      if (!currentDetail) {
        return currentDetail;
      }

      return updater(currentDetail);
    },
  );
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

      updateReviewInFeedCaches(queryClient, reviewId, (item) => ({
        ...item,
        engagement: {
          ...item.engagement,
          commentCount: item.engagement.commentCount + 1,
        },
      }));

      updateReviewDetailCache(queryClient, reviewId, (detail) => ({
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
    onSuccess: async (result) => {
      updateReviewInFeedCaches(queryClient, reviewId, (item) => {
        const alreadyLikedInCard = item.engagement.viewerHasLiked === true;

        return {
          ...item,
          engagement: {
            ...item.engagement,
            viewerHasLiked: true,
            likeCount:
              alreadyLikedInCard || result.alreadyLiked
                ? item.engagement.likeCount
                : item.engagement.likeCount + 1,
          },
        };
      });

      updateReviewDetailCache(queryClient, reviewId, (detail) => {
        const alreadyLikedInDetail = detail.engagement.viewerHasLiked === true;

        return {
          ...detail,
          engagement: {
            ...detail.engagement,
            viewerHasLiked: true,
            likeCount:
              alreadyLikedInDetail || result.alreadyLiked
                ? detail.engagement.likeCount
                : detail.engagement.likeCount + 1,
          },
        };
      });

      await queryClient.invalidateQueries({ queryKey: feedKeys.following });
    },
  });
};

export const useUnlikeReview = (reviewId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => unlikeReview(reviewId),
    onSuccess: async () => {
      updateReviewInFeedCaches(queryClient, reviewId, (item) => {
        const wasLikedInCard = item.engagement.viewerHasLiked === true;

        return {
          ...item,
          engagement: {
            ...item.engagement,
            viewerHasLiked: false,
            likeCount: wasLikedInCard
              ? Math.max(item.engagement.likeCount - 1, 0)
              : item.engagement.likeCount,
          },
        };
      });

      updateReviewDetailCache(queryClient, reviewId, (detail) => {
        const wasLikedInDetail = detail.engagement.viewerHasLiked === true;

        return {
          ...detail,
          engagement: {
            ...detail.engagement,
            viewerHasLiked: false,
            likeCount: wasLikedInDetail
              ? Math.max(detail.engagement.likeCount - 1, 0)
              : detail.engagement.likeCount,
          },
        };
      });

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
      updateReviewInFeedCaches(queryClient, reviewId, (item) => ({
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
      }));

      updateReviewDetailCache(queryClient, reviewId, (detail) => ({
        ...detail,
        content: updatedReview.content,
        containsSpoilers: updatedReview.containsSpoilers,
        updatedAt: updatedReview.updatedAt,
      }));

      await queryClient.invalidateQueries({ queryKey: feedKeys.following });
    },
  });
};
