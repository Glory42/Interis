import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FeedItem } from "@/features/feed/types";
import { feedKeys } from "@/features/feed/hooks/useFeed";
import { patchFeedItems } from "@/features/feed/hooks/feed-cache.helper";
import { restoreQueries } from "@/lib/query-optimistic";
import {
  addPostComment,
  createPost,
  deletePostComment,
  getPostById,
  getPostComments,
  likePost,
  unlikePost,
  updatePost,
  updatePostComment,
  type CreatePostInput,
  type PostComment,
  type PostCommentInput,
  type PostDetail,
  type UpdatePostInput,
} from "@/features/posts/api";

export const postKeys = {
  detail: (postId: string) => ["posts", "detail", postId] as const,
  comments: (postId: string) => ["posts", "comments", postId] as const,
};

const matchesPost = (item: FeedItem, postId: string): boolean => {
  if (item.post?.id === postId) {
    return true;
  }

  if (item.metadata.postId === postId) {
    return true;
  }

  return false;
};

const patchPostDetailCache = (
  queryClient: QueryClient,
  postId: string,
  updater: (detail: PostDetail) => PostDetail,
) => {
  const queryKey = postKeys.detail(postId);
  const previous = queryClient.getQueryData<PostDetail>(queryKey);
  if (previous) {
    queryClient.setQueryData<PostDetail>(queryKey, updater(previous));
  }

  return previous;
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePostInput) => createPost(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: feedKeys.followingRoot });
    },
  });
};

export const useUpdatePost = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdatePostInput) => updatePost(postId, payload),
    onSuccess: async (updatedPost) => {
      patchFeedItems(
        queryClient,
        (item) => matchesPost(item, postId),
        (item) => ({
          ...item,
          post: item.post
            ? {
                ...item.post,
                content: updatedPost.content,
              }
            : item.post,
          metadata: {
            ...item.metadata,
            excerpt: updatedPost.content,
          },
        }),
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: feedKeys.followingRoot }),
        queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) }),
      ]);
    },
  });
};

export const usePostDetail = (postId: string, enabled = true) =>
  useQuery({
    queryKey: postKeys.detail(postId),
    queryFn: () => getPostById(postId),
    enabled,
  });

export const usePostComments = (postId: string, enabled = true) =>
  useQuery({
    queryKey: postKeys.comments(postId),
    queryFn: () => getPostComments(postId),
    enabled,
  });

export const useAddPostComment = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PostCommentInput) => addPostComment(postId, payload),
    onMutate: async () => {
      const previousFeedQueries = patchFeedItems(
        queryClient,
        (item) => matchesPost(item, postId),
        (item) => ({
          ...item,
          engagement: {
            ...item.engagement,
            commentCount: item.engagement.commentCount + 1,
          },
        }),
      );

      return { previousFeedQueries };
    },
    onError: (_error, _variables, context) => {
      restoreQueries(queryClient, context?.previousFeedQueries ?? []);
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: postKeys.comments(postId) }),
        queryClient.invalidateQueries({ queryKey: feedKeys.followingRoot }),
      ]);
    },
  });
};

export const useUpdatePostComment = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { commentId: string; content: string }) =>
      updatePostComment(input.commentId, { content: input.content }),
    onSuccess: (updatedComment) => {
      queryClient.setQueryData<PostComment[]>(postKeys.comments(postId), (currentComments) =>
        currentComments?.map((comment) =>
          comment.id === updatedComment.id ? { ...comment, content: updatedComment.content } : comment,
        ),
      );
    },
  });
};

export const useDeletePostComment = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => deletePostComment(commentId),
    onSuccess: async (_data, commentId) => {
      queryClient.setQueryData<PostComment[]>(postKeys.comments(postId), (currentComments) =>
        currentComments?.filter((comment) => comment.id !== commentId),
      );

      patchFeedItems(
        queryClient,
        (item) => matchesPost(item, postId),
        (item) => ({
          ...item,
          engagement: {
            ...item.engagement,
            commentCount: Math.max(item.engagement.commentCount - 1, 0),
          },
        }),
      );

      await queryClient.invalidateQueries({ queryKey: feedKeys.followingRoot });
    },
  });
};

export const useLikePost = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => likePost(postId),
    onMutate: async () => {
      const previousFeedQueries = patchFeedItems(
        queryClient,
        (item) => matchesPost(item, postId),
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

      const previousDetail = patchPostDetailCache(queryClient, postId, (detail) => ({
        ...detail,
        likeCount: detail.likeCount + 1,
      }));

      return { previousFeedQueries, previousDetail };
    },
    onError: (_error, _variables, context) => {
      restoreQueries(queryClient, context?.previousFeedQueries ?? []);
      if (context?.previousDetail) {
        queryClient.setQueryData(postKeys.detail(postId), context.previousDetail);
      }
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: feedKeys.followingRoot }),
        queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) }),
      ]);
    },
  });
};

export const useUnlikePost = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => unlikePost(postId),
    onMutate: async () => {
      const previousFeedQueries = patchFeedItems(
        queryClient,
        (item) => matchesPost(item, postId),
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

      const previousDetail = patchPostDetailCache(queryClient, postId, (detail) => ({
        ...detail,
        likeCount: Math.max(detail.likeCount - 1, 0),
      }));

      return { previousFeedQueries, previousDetail };
    },
    onError: (_error, _variables, context) => {
      restoreQueries(queryClient, context?.previousFeedQueries ?? []);
      if (context?.previousDetail) {
        queryClient.setQueryData(postKeys.detail(postId), context.previousDetail);
      }
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: feedKeys.followingRoot }),
        queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) }),
      ]);
    },
  });
};
