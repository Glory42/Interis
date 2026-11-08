import { addUuid, contentKind, projectItem, reviewById } from "../social-feed-item.helper";
import type { FeedKind } from "../../types/social-feed-kind.types";

// Kinds with no review or post behind them; their likes are the activity's own.
const ownLikes = (kind: FeedKind): FeedKind => ({
  ...kind,
  collect: (parsed, ids) => {
    kind.collect(parsed, ids);
    ids.likedActivities.add(parsed.activity.id);
  },
});

// Ratings are recorded as liked_movie rows that carry a rating.
export const likedFilmFeedKind = ownLikes({
  ...contentKind,
  joinTitleGroup: (group, item) => {
    if (item.metadata.rating === null) {
      group.liked = true;
    }
  },
});

export const watchlistedFilmFeedKind = ownLikes({
  ...contentKind,
  joinTitleGroup: (group) => {
    group.watchlisted = true;
  },
});

// A follow names its target by id, so it shows the target's current username,
// and goes once the account is deleted (#102).
export const followedUserFeedKind = ownLikes({
  collect: (parsed, ids) => {
    contentKind.collect(parsed, ids);
    ids.users.add(parsed.activity.entityId);
  },
  isDead: (parsed, context) =>
    !context.users.has(parsed.activity.entityId) || contentKind.isDead(parsed, context),
  project: (parsed, context) =>
    projectItem(parsed, context, {
      review: reviewById(context, parsed.metadata.reviewId),
      metadata: { targetUsername: context.users.get(parsed.activity.entityId)!.username },
    }),
});

// A private list stays out of every feed, its owner's included, and comes back
// if it's made public again. The title is the list's current one.
export const createdListFeedKind = ownLikes({
  collect: (parsed, ids) => {
    contentKind.collect(parsed, ids);
    addUuid(ids.lists, parsed.activity.entityId);
  },
  isDead: (parsed, context) =>
    !context.lists.get(parsed.activity.entityId)?.isPublic || contentKind.isDead(parsed, context),
  project: (parsed, context) => {
    const list = context.lists.get(parsed.activity.entityId)!;
    return projectItem(parsed, context, {
      review: reviewById(context, parsed.metadata.reviewId),
      metadata: { listId: list.id, listTitle: list.title },
    });
  },
});
