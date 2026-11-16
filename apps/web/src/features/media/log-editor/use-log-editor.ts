import { useState } from "react";
import { useLogPrivateFields } from "@/features/diary/hooks/useDiaryTags";
import { useFilmInteraction, useUpdateFilmInteraction } from "@/features/interactions/hooks/useInteractions";
import type { ExistingLogSubject, LogSubject } from "@/features/media/log-editor/log-subject";
import {
  currentPrivateFields,
  EMPTY_PRIVATE_FIELDS,
  privateFieldChanges,
  type PrivateFieldsEdit,
} from "@/features/media/log-editor/log-private-fields";
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

const createInput = (draft: LogDraft, extras: { note: string; tags: string[] }): CreateLogInput => {
  const review = draft.review.trim();
  const note = extras.note.trim();
  return {
    watchedDate: draft.watchedDate,
    ...(draft.rating !== null ? { rating: draft.rating } : {}),
    rewatch: draft.rewatch,
    ...(review ? { review, containsSpoilers: draft.containsSpoilers } : {}),
    ...(note ? { note } : {}),
    ...(extras.tags.length > 0 ? { tags: extras.tags } : {}),
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

export const useLogEditor = (
  subject: LogSubject,
  onClose: () => void,
  onSaved?: (changes: UpdateLogInput | null) => void,
) => {
  const [draft, setDraft] = useState(() => initialDraft(subject));
  // Note and tags are tracked as edits over the saved values, which may still be loading.
  const [privateEdit, setPrivateEdit] = useState<PrivateFieldsEdit>({});
  const privateQuery = useLogPrivateFields(
    subject.kind,
    subject.type === "existing" ? subject.logId : "",
    subject.type === "existing" && !subject.privateFields,
  );
  const privateBaseline =
    subject.type === "new" ? EMPTY_PRIVATE_FIELDS : (subject.privateFields ?? privateQuery.data ?? null);
  const privateFields = currentPrivateFields(privateBaseline, privateEdit);
  // null until toggled here, so the fetched Like shows without an effect to copy it.
  const [likedOverride, setLikedOverride] = useState<boolean | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleLike = useTitleLike(subject);
  const createLog = useCreateLog();
  const updateLog = useUpdateLog();

  const liked = likedOverride ?? titleLike.liked;
  const likedChanged = liked !== titleLike.liked;
  const changes =
    subject.type === "existing"
      ? { ...editInput(subject, draft), ...(privateBaseline ? privateFieldChanges(privateBaseline, privateEdit) : {}) }
      : null;
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
          ? createLog.mutateAsync({ title: subject, input: createInput(draft, privateFields) })
          : changes && Object.keys(changes).length > 0
            ? updateLog.mutateAsync({ log: subject, input: changes })
            : null,
        likedChanged ? titleLike.saveLiked(liked) : null,
      ]);
      if (subject.type === "new") clearReviewDraft(draftKey(subject));
      onSaved?.(changes);
      onClose();
    } catch (error) {
      setFormError(isApiError(error) ? error.message : "Could not save this log right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const privateState = {
    ...privateFields,
    // Until the saved note and tags arrive, editing them could overwrite what's there.
    isReady: privateBaseline !== null,
    hasSavedNote: Boolean(privateBaseline?.note),
    change: (patch: PrivateFieldsEdit) => setPrivateEdit((current) => ({ ...current, ...patch })),
  };

  return {
    draft,
    change,
    privateFields: privateState,
    liked,
    setLiked: setLikedOverride,
    formError,
    isSubmitting,
    canSubmit,
    save,
  };
};
