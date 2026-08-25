import { ACTIVITY_EXCERPT_LENGTH } from "../constants/activity.constants";

/**
 * Truncates freeform user content (review/post/comment bodies) down to an
 * activity-feed-safe excerpt length.
 */
export const truncateExcerpt = (
  content: string,
  length: number = ACTIVITY_EXCERPT_LENGTH,
): string => {
  return content.slice(0, length);
};
