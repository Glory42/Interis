import { useState } from "react";

type ReviewDraftSource = { content: string; containsSpoilers: boolean } | null | undefined;

// Hydrates a review textarea's draft state from an async query (the
// season/episode review GET) once it resolves, without clobbering
// whatever the user has already typed if they started editing before
// that resolution landed - see SeasonAccordionItem.tsx's onOpenReview
// wiring for where `reset` is called to start a fresh draft.
export const useReviewDraftSync = (data: ReviewDraftSource) => {
  const [content, setContent] = useState("");
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  const [hasEdited, setHasEdited] = useState(false);

  const [prevData, setPrevData] = useState(data);
  if (data !== prevData) {
    setPrevData(data);
    if (!hasEdited) {
      setContent(data?.content ?? "");
      setContainsSpoilers(data?.containsSpoilers ?? false);
    }
  }

  const onContentChange = (value: string) => {
    setHasEdited(true);
    setContent(value);
  };

  const reset = () => {
    setHasEdited(false);
  };

  return { content, containsSpoilers, setContainsSpoilers, onContentChange, reset };
};
