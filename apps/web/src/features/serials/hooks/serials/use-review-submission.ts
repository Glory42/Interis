import { useState, type FormEvent } from "react";
import type { useReviewDraft } from "@/features/serials/hooks/serials/use-review-draft";

type ReviewDraft = ReturnType<typeof useReviewDraft>;

type UseReviewSubmissionArgs = {
  draft: ReviewDraft;
  saveReview: (input: { content: string; containsSpoilers: boolean }) => Promise<unknown>;
  deleteReview: () => Promise<unknown>;
  onClose: () => void;
};

// The season/episode review editor in SeasonAccordionItem; the caller picks
// which review the save and delete go to.
export const useReviewSubmission = ({
  draft,
  saveReview,
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
      await saveReview({
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
