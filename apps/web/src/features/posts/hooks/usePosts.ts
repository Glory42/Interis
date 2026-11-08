import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateFollowingFeed, patchFeed, restoreFeed } from "@/features/feed/hooks/feed-cache";
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
      await invalidateFollowingFeed(queryClient);
    },
  });
};

export const useUpdatePost = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdatePostInput) => updatePost(postId, payload),
    onSuccess: async (updatedPost) => {
      await patchFeed(queryClient, { post: postId }, { type: "post-edited", content: updatedPost.content });

      await Promise.all([
        invalidateFollowingFeed(queryClient),
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
      const previousFeedQueries = await patchFeed(queryClient, { post: postId }, { type: "comment-added" });

      return { previousFeedQueries };
    },
    onError: (_error, _variables, context) => {
      restoreFeed(queryClient, context?.previousFeedQueries);
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: postKeys.comments(postId) }),
        invalidateFollowingFeed(queryClient),
      ]);
    },
  });
};

export const useUpdatePostComment = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { commentId: string; content: string }) =>
      updatePostComment(input.commentId, { content: input.content }),
    onSuccess: async (updatedComment) => {
      queryClient.setQueryData<PostComment[]>(postKeys.comments(postId), (currentComments) =>
        currentComments?.map((comment) =>
          comment.id === updatedComment.id ? { ...comment, content: updatedComment.content } : comment,
        ),
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

export const useDeletePostComment = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => deletePostComment(commentId),
    onSuccess: async (_data, commentId) => {
      queryClient.setQueryData<PostComment[]>(postKeys.comments(postId), (currentComments) =>
        currentComments?.filter((comment) => comment.id !== commentId),
      );

      await patchFeed(queryClient, { post: postId }, { type: "comment-removed" });

      await invalidateFollowingFeed(queryClient);
    },
  });
};

export const useLikePost = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { errorToast: "Couldn't like this post" },
    mutationFn: () => likePost(postId),
    onMutate: async () => {
      const previousFeedQueries = await patchFeed(queryClient, { post: postId }, { type: "liked" });

      const previousDetail = patchPostDetailCache(queryClient, postId, (detail) => ({
        ...detail,
        likeCount: detail.likeCount + 1,
      }));

      return { previousFeedQueries, previousDetail };
    },
    onError: (_error, _variables, context) => {
      restoreFeed(queryClient, context?.previousFeedQueries);
      if (context?.previousDetail) {
        queryClient.setQueryData(postKeys.detail(postId), context.previousDetail);
      }
    },
    onSettled: async () => {
      await Promise.all([
        invalidateFollowingFeed(queryClient),
        queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) }),
      ]);
    },
  });
};

export const useUnlikePost = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { errorToast: "Couldn't unlike this post" },
    mutationFn: () => unlikePost(postId),
    onMutate: async () => {
      const previousFeedQueries = await patchFeed(queryClient, { post: postId }, { type: "unliked" });

      const previousDetail = patchPostDetailCache(queryClient, postId, (detail) => ({
        ...detail,
        likeCount: Math.max(detail.likeCount - 1, 0),
      }));

      return { previousFeedQueries, previousDetail };
    },
    onError: (_error, _variables, context) => {
      restoreFeed(queryClient, context?.previousFeedQueries);
      if (context?.previousDetail) {
        queryClient.setQueryData(postKeys.detail(postId), context.previousDetail);
      }
    },
    onSettled: async () => {
      await Promise.all([
        invalidateFollowingFeed(queryClient),
        queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) }),
      ]);
    },
  });
};
