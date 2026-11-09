import { useState } from "react";
import { useFilmInteraction, useUpdateFilmInteraction } from "@/features/interactions/hooks/useInteractions";
import type { ExistingLogSubject, LogSubject } from "@/features/media/log-editor/log-subject";
import { clearReviewDraft, readReviewDraft, writeReviewDraft } from "@/features/media/log-editor/review-draft";
import {
  useCreateLog,
  useUpdateLog,
  type CreateLogInput,
  type UpdateLogInput,
} from "@/features/media/log-editor/use-log-mutations";
import type { MediaTitle } from "@/features/media/media-cache";
import { useSeriesInteraction, useUpdateSeriesInteraction } from "@/features/tv/hooks/useTv";
import { isApiError } from "@/lib/api-client";
import { todayAsLocalDateInput } from "@/lib/time";

export type LogDraft = {
  watchedDate: string;
  rating: number | null;
  rewatch: boolean;
  review: string;
  containsSpoilers: boolean;
};

// Unposted review text of a new log survives a reload, e.g. "movie:550".
const draftKey = ({ kind, tmdbId }: MediaTitle) => `${kind === "film" ? "movie" : "tv"}:${tmdbId}`;

const initialDraft = (subject: LogSubject): LogDraft =>
  subject.type === "new"
    ? {
        watchedDate: todayAsLocalDateInput(),
        rating: subject.rating,
        rewatch: subject.rewatch,
        review: readReviewDraft(draftKey(subject)),
        containsSpoilers: false,
      }
    : {
        watchedDate: subject.watchedDate,
        rating: subject.rating,
        rewatch: subject.rewatch,
        review: subject.review?.content ?? "",
        containsSpoilers: subject.review?.containsSpoilers ?? false,
      };

const createInput = (draft: LogDraft): CreateLogInput => {
  const review = draft.review.trim();
  return {
    watchedDate: draft.watchedDate,
    ...(draft.rating !== null ? { rating: draft.rating } : {}),
    rewatch: draft.rewatch,
    ...(review ? { review, containsSpoilers: draft.containsSpoilers } : {}),
  };
};

// Only what changed; emptying the review text deletes the attached Review.
export const editInput = (subject: ExistingLogSubject, draft: LogDraft): UpdateLogInput => {
  const review = draft.review.trim();
  const before = subject.review;
  const reviewChange =
    review !== (before?.content ?? "")
      ? review
        ? { review, containsSpoilers: draft.containsSpoilers }
        : { review: null }
      : before && draft.containsSpoilers !== before.containsSpoilers
        ? { containsSpoilers: draft.containsSpoilers }
        : {};
  return {
    ...(draft.watchedDate !== subject.watchedDate && { watchedDate: draft.watchedDate }),
    ...(draft.rating !== subject.rating && { rating: draft.rating }),
    ...(draft.rewatch !== subject.rewatch && { rewatch: draft.rewatch }),
    ...reviewChange,
  };
};

// The title's Like lives on its Interaction, not on the log.
const useTitleLike = ({ kind, tmdbId }: MediaTitle) => {
  const filmInteraction = useFilmInteraction(tmdbId, kind === "film");
  const seriesInteraction = useSeriesInteraction(tmdbId, kind === "tv");
  const updateFilmInteraction = useUpdateFilmInteraction(tmdbId);
  const updateSeriesInteraction = useUpdateSeriesInteraction(tmdbId);
  const liked = (kind === "film" ? filmInteraction.data : seriesInteraction.data)?.liked ?? false;
  const saveLiked = (nextLiked: boolean) =>
    (kind === "film" ? updateFilmInteraction : updateSeriesInteraction).mutateAsync({ liked: nextLiked });
  return { liked, saveLiked };
};

export const useLogEditor = (subject: LogSubject, onClose: () => void) => {
  const [draft, setDraft] = useState(() => initialDraft(subject));
  // null until toggled here, so the fetched Like shows without an effect to copy it.
  const [likedOverride, setLikedOverride] = useState<boolean | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleLike = useTitleLike(subject);
  const createLog = useCreateLog();
  const updateLog = useUpdateLog();

  const liked = likedOverride ?? titleLike.liked;
  const likedChanged = liked !== titleLike.liked;
  const changes = subject.type === "existing" ? editInput(subject, draft) : null;
  const canSubmit = changes === null || Object.keys(changes).length > 0 || likedChanged;

  const change = (patch: Partial<LogDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    if (subject.type === "new" && patch.review !== undefined) writeReviewDraft(draftKey(subject), patch.review);
  };

  const save = async () => {
    if (!canSubmit || isSubmitting) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      // Like is sent only when toggled, so a slow Interaction fetch can't unlike the title.
      await Promise.all([
        subject.type === "new"
          ? createLog.mutateAsync({ title: subject, input: createInput(draft) })
          : changes && Object.keys(changes).length > 0
            ? updateLog.mutateAsync({ log: subject, input: changes })
            : null,
        likedChanged ? titleLike.saveLiked(liked) : null,
      ]);
      if (subject.type === "new") clearReviewDraft(draftKey(subject));
      onClose();
    } catch (error) {
      setFormError(isApiError(error) ? error.message : "Could not save this log right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return { draft, change, liked, setLiked: setLikedOverride, formError, isSubmitting, canSubmit, save };
};
