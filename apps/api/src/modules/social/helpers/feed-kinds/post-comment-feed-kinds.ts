import { truncateExcerpt } from "../../../../commons/helpers/text.helper";
import { addUuid, contentKind, projectItem, reviewById } from "../social-feed-item.helper";
import type { FeedCommentRow, FeedContext, FeedIds, FeedKind } from "../../types/social-feed-kind.types";

// A post, or a like of one: the post's own id or the one its metadata names,
// so it is dead once the post is deleted.
export const postFeedKind: FeedKind = contentKind;

export const likedPostFeedKind: FeedKind = { ...contentKind, isLike: true };

// Recorded by older versions only; kept readable for the rows still around.
export const likedCommentFeedKind: FeedKind = { ...contentKind, isLike: true };

// A comment on a review or a post. The comment's own row is loaded with its
// parent, so a deleted comment drops out even if its activity was left behind,
// and the excerpt is the comment's current text, read live like a review's.
const commentKind = (table: (ids: FeedIds) => Set<string>, rows: (context: FeedContext) => Map<string, FeedCommentRow>): FeedKind => ({
  collect: (parsed, ids) => {
    contentKind.collect(parsed, ids);
    addUuid(table(ids), parsed.activity.entityId);
  },
  isDead: (parsed, context) => contentKind.isDead(parsed, context) || !rows(context).has(parsed.activity.entityId),
  project: (parsed, context) =>
    projectItem(parsed, context, {
      review: reviewById(context, parsed.metadata.reviewId),
      metadata: { excerpt: truncateExcerpt(rows(context).get(parsed.activity.entityId)!.content) },
    }),
});

export const reviewCommentFeedKind = commentKind((ids) => ids.reviewComments, (context) => context.reviewComments);

export const postCommentFeedKind = commentKind((ids) => ids.postComments, (context) => context.postComments);
