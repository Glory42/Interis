import { truncateExcerpt as toExcerpt } from "../../../commons/helpers/text.helper";
import type { PostFeedMetadata } from "../types/posts.types";

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
