import { parseActivity } from "../social-feed-item.helper";
import { emptyFeedIds, loadFeedContext } from "../social-feed-context.helper";
import { diaryEntryFeedKind, likedReviewFeedKind, reviewFeedKind } from "./review-feed-kinds";
import {
  likedCommentFeedKind,
  likedPostFeedKind,
  postCommentFeedKind,
  postFeedKind,
  reviewCommentFeedKind,
} from "./post-comment-feed-kinds";
import {
  createdListFeedKind,
  followedUserFeedKind,
  likedFilmFeedKind,
  watchlistedFilmFeedKind,
} from "./standalone-feed-kinds";
import type { ActivityRow, FeedActivityKind, FeedItem } from "../../types/social-feed.types";
import type { FeedKind } from "../../types/social-feed-kind.types";

// How each activity kind is loaded, judged dead and shown in the Following Feed.
export const FEED_KINDS: Record<FeedActivityKind, FeedKind> = {
  diary_entry: diaryEntryFeedKind,
  review: reviewFeedKind,
  liked_review: likedReviewFeedKind,
  commented: reviewCommentFeedKind,
  post: postFeedKind,
  liked_post: likedPostFeedKind,
  commented_post: postCommentFeedKind,
  liked_comment: likedCommentFeedKind,
  liked_movie: likedFilmFeedKind,
  watchlisted_movie: watchlistedFilmFeedKind,
  followed_user: followedUserFeedKind,
  created_list: createdListFeedKind,
};

// Rows to feed items: every kind's ids are collected first and loaded in one
// round of batched queries, then rows about deleted content are dropped.
export const toFeedItems = async (rows: ActivityRow[], viewerId?: string): Promise<FeedItem[]> => {
  const parsed = rows.map(parseActivity);
  const ids = emptyFeedIds();
  for (const activity of parsed) {
    FEED_KINDS[activity.kind].collect(activity, ids);
  }

  const context = await loadFeedContext(ids, viewerId);
  return parsed
    .filter((activity) => !FEED_KINDS[activity.kind].isDead(activity, context))
    .map((activity) => FEED_KINDS[activity.kind].project(activity, context));
};
