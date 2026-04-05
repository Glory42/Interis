import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FeedItem } from "@/features/feed/types";
import { feedKeys } from "@/features/feed/hooks/useFeed";
import {
  addPostComment,
  createPost,
  getPostById,
  getPostComments,
  likePost,
  unlikePost,
  updatePost,
  type CreatePostInput,
  type PostCommentInput,
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

const updatePostInFeedCaches = (
  queryClient: QueryClient,
  postId: string,
  updater: (item: FeedItem) => FeedItem,
) => {
  queryClient.setQueryData<FeedItem[]>(feedKeys.following, (currentItems) => {
    if (!currentItems) {
      return currentItems;
    }

    return currentItems.map((item) => (matchesPost(item, postId) ? updater(item) : item));
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePostInput) => createPost(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: feedKeys.following });
    },
  });
};

export const useUpdatePost = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdatePostInput) => updatePost(postId, payload),
    onSuccess: async (updatedPost) => {
      updatePostInFeedCaches(queryClient, postId, (item) => ({
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
      }));

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: feedKeys.following }),
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
    onSuccess: async () => {
      updatePostInFeedCaches(queryClient, postId, (item) => ({
        ...item,
        engagement: {
          ...item.engagement,
          commentCount: item.engagement.commentCount + 1,
        },
      }));

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: postKeys.comments(postId) }),
        queryClient.invalidateQueries({ queryKey: feedKeys.following }),
      ]);
    },
  });
};

export const useLikePost = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => likePost(postId),
    onSuccess: async (result) => {
      updatePostInFeedCaches(queryClient, postId, (item) => {
        const alreadyLiked = item.engagement.viewerHasLiked === true;

        return {
          ...item,
          engagement: {
            ...item.engagement,
            viewerHasLiked: true,
            likeCount:
              alreadyLiked || result.wasNew === false
                ? item.engagement.likeCount
                : item.engagement.likeCount + 1,
          },
        };
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: feedKeys.following }),
        queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) }),
      ]);
    },
  });
};

export const useUnlikePost = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => unlikePost(postId),
    onSuccess: async () => {
      updatePostInFeedCaches(queryClient, postId, (item) => {
        const wasLiked = item.engagement.viewerHasLiked === true;

        return {
          ...item,
          engagement: {
            ...item.engagement,
            viewerHasLiked: false,
            likeCount: wasLiked
              ? Math.max(item.engagement.likeCount - 1, 0)
              : item.engagement.likeCount,
          },
        };
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: feedKeys.following }),
        queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) }),
      ]);
    },
  });
};
