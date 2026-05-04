import { POST_ACTIVITY_EXCERPT_LENGTH } from "../constants/posts.constants";
import type { PostFeedMetadata } from "../types/posts.types";

const toExcerpt = (content: string): string => {
  return content.slice(0, POST_ACTIVITY_EXCERPT_LENGTH);
};

export const buildPostCreatedActivityMetadata = (input: {
  post: PostFeedMetadata;
}) => ({
  postId: input.post.id,
  content: input.post.content,
  excerpt: toExcerpt(input.post.content),
  mediaId: input.post.mediaId,
  mediaType: input.post.mediaType,
});

export const buildPostLikedActivityMetadata = (input: {
  post: PostFeedMetadata;
}) => ({
  action: "liked_post",
  postId: input.post.id,
  content: input.post.content,
  excerpt: toExcerpt(input.post.content),
  mediaId: input.post.mediaId,
  mediaType: input.post.mediaType,
});

export const buildPostCommentedActivityMetadata = (input: {
  post: PostFeedMetadata;
  commentId: string;
  commentContent: string;
}) => ({
  action: "commented_post",
  postId: input.post.id,
  commentId: input.commentId,
  content: input.post.content,
  excerpt: toExcerpt(input.commentContent),
  mediaId: input.post.mediaId,
  mediaType: input.post.mediaType,
});
