import { truncateExcerpt } from "../../../commons/helpers/text.helper";

// A Series review's extra Activity fields; ActivityRecorder supplies the target's.
export const buildReviewExtraMetadata = (review: {
  id: string;
  content: string;
  containsSpoilers: boolean;
}) => ({
  reviewId: review.id,
  excerpt: truncateExcerpt(review.content),
  containsSpoilers: review.containsSpoilers,
});
