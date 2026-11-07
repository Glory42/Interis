import { useState } from "react";

type ReviewDraftSource = { content: string; containsSpoilers: boolean } | null;

// The season/episode review textarea's draft. `start` fills it from the
// review being edited (picked in the review chooser), or clears it for a
// new review.
export const useReviewDraft = () => {
  const [content, setContent] = useState("");
  const [containsSpoilers, setContainsSpoilers] = useState(false);

  const start = (review: ReviewDraftSource) => {
    setContent(review?.content ?? "");
    setContainsSpoilers(review?.containsSpoilers ?? false);
  };

  return { content, containsSpoilers, setContainsSpoilers, onContentChange: setContent, start };
};
