import { useMutation, useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { addReviewComment, getReviewComments, getReviewDetail, setReviewLiked } from "@/api/reviews";
import { getErrorMessage } from "@/api/client";
import { showToast } from "@/lib/toast";
import type { FeedPage } from "@/types/feed";
import type { ReviewDetail } from "@/types/reviews";

export const reviewKeys = {
  detail: (reviewId: string) => ["reviews", "detail", reviewId] as const,
  comments: (reviewId: string) => ["reviews", "comments", reviewId] as const,
};

export const useReviewDetail = (username: string, reviewId: string) =>
  useQuery({
    queryKey: reviewKeys.detail(reviewId),
    queryFn: ({ signal }) => getReviewDetail(username, reviewId, { signal }),
  });

export const useReviewComments = (reviewId: string) =>
  useQuery({
    queryKey: reviewKeys.comments(reviewId),
    queryFn: ({ signal }) => getReviewComments(reviewId, { signal }),
  });

export const useAddReviewComment = (reviewId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => addReviewComment(reviewId, content),
    onError: (error) => showToast(getErrorMessage(error, "Could not post your comment.")),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: reviewKeys.comments(reviewId) }),
        queryClient.invalidateQueries({ queryKey: reviewKeys.detail(reviewId) }),
      ]),
  });
};

const patchFeedPages = (
  data: InfiniteData<FeedPage> | undefined,
  reviewId: string,
  liked: boolean,
): InfiniteData<FeedPage> | undefined => {
  if (!data) return data;

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((item) => {
        const itemReviewId = item.review?.id ?? item.metadata.reviewId;
        if (itemReviewId !== reviewId || Boolean(item.engagement.viewerHasLiked) === liked) {
          return item;
        }
        return {
          ...item,
          engagement: {
            ...item.engagement,
            viewerHasLiked: liked,
            likeCount: Math.max(0, item.engagement.likeCount + (liked ? 1 : -1)),
          },
        };
      }),
    })),
  };
};

// Likes are patched in place in every cached feed page and the review detail
// instead of refetching the feed (narrow updates, see CLAUDE.md).
// `refreshKey` lets a media detail screen (whose review list carries its own
// like counts) refetch just itself once the like settles.
export const useToggleReviewLike = (refreshKey?: readonly unknown[]) => {
  const queryClient = useQueryClient();

  const applyLike = (reviewId: string, liked: boolean) => {
    queryClient.setQueriesData<InfiniteData<FeedPage>>({ queryKey: ["feed", "following"] }, (data) =>
      patchFeedPages(data, reviewId, liked),
    );
    queryClient.setQueryData<ReviewDetail>(reviewKeys.detail(reviewId), (detail) =>
      detail && Boolean(detail.engagement.viewerHasLiked) !== liked
        ? {
            ...detail,
            engagement: {
              ...detail.engagement,
              viewerHasLiked: liked,
              likeCount: Math.max(0, detail.engagement.likeCount + (liked ? 1 : -1)),
            },
          }
        : detail,
    );
  };

  return useMutation({
    mutationFn: ({ reviewId, liked }: { reviewId: string; liked: boolean }) =>
      setReviewLiked(reviewId, liked),
    onMutate: ({ reviewId, liked }) => applyLike(reviewId, liked),
    onError: (error, { reviewId, liked }) => {
      applyLike(reviewId, !liked);
      showToast(getErrorMessage(error, "Could not update like."));
    },
    onSettled: () =>
      refreshKey ? queryClient.invalidateQueries({ queryKey: refreshKey }) : undefined,
  });
};
