import {
  addUuid,
  collectShared,
  liveReviewMetadata,
  projectItem,
  reviewById,
  sharedContentGone,
} from "../social-feed-item.helper";
import type { FeedContext, FeedKind, ParsedActivity } from "../../types/social-feed-kind.types";

// Writing or liking a review: the review is the activity's whole point, so it
// is dead without it, and it always shows the live review's text.
const reviewIdOf = ({ activity, metadata }: ParsedActivity): string => metadata.reviewId ?? activity.entityId;

const reviewKind = (extra: Pick<FeedKind, "joinTitleGroup" | "isLike">): FeedKind => ({
  collect: (parsed, ids) => collectShared(parsed, ids, reviewIdOf(parsed)),
  isDead: (parsed, context) => sharedContentGone(parsed, context, reviewIdOf(parsed)),
  project: (parsed, context) => {
    const review = reviewById(context, reviewIdOf(parsed));
    return projectItem(parsed, context, { review, metadata: liveReviewMetadata(review) });
  },
  ...extra,
});

export const reviewFeedKind = reviewKind({ joinTitleGroup: () => {} });

export const likedReviewFeedKind = reviewKind({ isLike: true });

// A log of a Film or Series: rating, rewatch and watch day come from the live
// log, so an edit shows up too. A log outlives its review and stays without it.
const logOf = (parsed: ParsedActivity, context: FeedContext) => context.logs.get(parsed.activity.entityId) ?? null;

export const diaryEntryFeedKind: FeedKind = {
  collect: (parsed, ids) => {
    collectShared(parsed, ids, parsed.metadata.reviewId);
    addUuid(ids.logs, parsed.activity.entityId);
  },
  isDead: (parsed, context) => !logOf(parsed, context) || sharedContentGone(parsed, context, null),
  project: (parsed, context) => {
    const log = logOf(parsed, context)!;
    const review =
      reviewById(context, parsed.metadata.reviewId) ?? context.reviews.byDiaryEntryId.get(log.id) ?? null;
    return projectItem(parsed, context, {
      review,
      metadata: {
        ...liveReviewMetadata(review),
        rating: log.rating,
        rewatch: log.rewatch,
        logId: log.id,
        watchedDate: log.watchedDate,
      },
    });
  },
  joinTitleGroup: (group, item) => {
    group.watched = true;
    group.rewatch = group.rewatch || item.metadata.rewatch === true;
    const { logId, watchedDate } = item.metadata;
    if (!group.log && logId && watchedDate) {
      group.log = { id: logId, watchedDate, rating: item.metadata.rating, rewatch: item.metadata.rewatch === true };
    }
  },
};
