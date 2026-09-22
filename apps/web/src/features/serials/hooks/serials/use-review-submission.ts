import { useState, type FormEvent } from "react";
import type { useReviewDraftSync } from "@/features/serials/hooks/serials/use-review-draft-sync";

type ReviewDraft = ReturnType<typeof useReviewDraftSync>;

type UseReviewSubmissionArgs = {
  draft: ReviewDraft;
  upsertReview: (input: { content: string; containsSpoilers?: boolean }) => Promise<unknown>;
  deleteReview: () => Promise<unknown>;
  onClose: () => void;
};

// Deep module: owns the season/episode review submit-validate-error cycle
// that SeasonAccordionItem previously duplicated once per season and once
// per episode. Both callers only differ in which mutation they hand in.
export const useReviewSubmission = ({
  draft,
  upsertReview,
  deleteReview,
  onClose,
}: UseReviewSubmissionArgs) => {
  const [formError, setFormError] = useState<string | null>(null);

  const close = () => {
    setFormError(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!draft.content.trim()) {
      setFormError("Please write a review before saving.");
      return;
    }

    setFormError(null);

    try {
      await upsertReview({
        content: draft.content.trim(),
        containsSpoilers: draft.containsSpoilers,
      });
      onClose();
    } catch {
      setFormError("Failed to save the review. Please try again.");
    }
  };

  const handleDelete = async () => {
    await deleteReview();
    onClose();
  };

  return { formError, handleSubmit, handleDelete, close };
};
