import type { AttachedReview, WatchLogUpdateInput } from "../types/watch-log.types";

// Extra fields only: ActivityRecorder.recordMedia supplies the title's. The
// feed reads the live log and Review, so no review text is copied here.
export const buildWatchLogActivityMetadata = (input: {
  rating: number | null;
  rewatch: boolean;
  review: { id: string } | null;
}) => ({
  rating: input.rating,
  rewatch: input.rewatch,
  hasReview: Boolean(input.review),
  reviewId: input.review?.id ?? null,
});

export type LogReviewEdit =
  | { kind: "none" }
  | { kind: "create"; content: string; containsSpoilers: boolean }
  | { kind: "update"; reviewId: string; content?: string; containsSpoilers?: boolean }
  | { kind: "delete"; reviewId: string };

// What a log edit does to the Review attached to the log.
export const resolveLogReviewEdit = (
  input: Pick<WatchLogUpdateInput, "review" | "containsSpoilers">,
  attached: AttachedReview | null,
): LogReviewEdit => {
  const { containsSpoilers } = input;
  if (input.review === undefined) {
    return attached && containsSpoilers !== undefined
      ? { kind: "update", reviewId: attached.id, containsSpoilers }
      : { kind: "none" };
  }

  const content = input.review?.trim() ?? "";
  if (!content) {
    return attached ? { kind: "delete", reviewId: attached.id } : { kind: "none" };
  }
  return attached
    ? { kind: "update", reviewId: attached.id, content, containsSpoilers }
    : { kind: "create", content, containsSpoilers: containsSpoilers ?? false };
};
