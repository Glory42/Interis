import { contentKind } from "../social-feed-item.helper";
import type { FeedKind } from "../../types/social-feed-kind.types";

// A post, or a like of one: the post's own id or the one its metadata names,
// so it is dead once the post is deleted.
export const postFeedKind: FeedKind = contentKind;

export const likedPostFeedKind: FeedKind = { ...contentKind, isLike: true };

// Recorded by older versions only; kept readable for the rows still around.
export const likedCommentFeedKind: FeedKind = { ...contentKind, isLike: true };

// A comment on a review or a post: dead once the review or post is deleted.
export const reviewCommentFeedKind: FeedKind = contentKind;

export const postCommentFeedKind: FeedKind = contentKind;
