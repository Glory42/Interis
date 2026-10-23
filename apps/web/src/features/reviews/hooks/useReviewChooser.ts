import { useState } from "react";
import type { MyTitleReview, MyTitleReviewsQuery } from "@/features/reviews/api";
import { useFetchMyTitleReviews } from "@/features/reviews/hooks/useReviews";

type ReviewChooserOpenState = {
  reviews: MyTitleReview[];
  onWriteNew: () => void;
};

// Backs the Review / Log buttons (#74): with no review of the title yet the
// editor opens straight away, otherwise the viewer first picks between
// writing a new review and editing one they already wrote.
export const useReviewChooser = () => {
  const fetchMyTitleReviews = useFetchMyTitleReviews();
  const [openState, setOpenState] = useState<ReviewChooserOpenState | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const start = async (query: MyTitleReviewsQuery, onWriteNew: () => void) => {
    setIsChecking(true);
    try {
      const reviews = await fetchMyTitleReviews(query);
      if (reviews.length === 0) {
        onWriteNew();
      } else {
        setOpenState({ reviews, onWriteNew });
      }
    } catch {
      // Writing a new review never overwrites one, so it's the safe
      // fallback when the list can't be loaded.
      onWriteNew();
    } finally {
      setIsChecking(false);
    }
  };

  return {
    reviews: openState?.reviews ?? null,
    isChecking,
    start: (query: MyTitleReviewsQuery, onWriteNew: () => void) => {
      void start(query, onWriteNew);
    },
    writeNew: () => {
      openState?.onWriteNew();
      setOpenState(null);
    },
    close: () => setOpenState(null),
  };
};

export type ReviewChooser = ReturnType<typeof useReviewChooser>;
