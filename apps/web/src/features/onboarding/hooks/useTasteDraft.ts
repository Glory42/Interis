import { useCallback, useEffect, useState } from "react";
import type { ViewerStatus } from "@/features/viewer-status/api";
import {
  readTasteDraft,
  serverMark,
  writeTasteDraft,
  type TasteDraft,
  type TasteMark,
} from "@/features/onboarding/taste-draft";

// The taste grid's marks: saved state from viewer-status, plus unsaved taps
// kept in session storage so a refresh doesn't lose them.
export const useTasteDraft = (userId: string, statuses: Map<string, ViewerStatus>) => {
  const [draft, setDraft] = useState<TasteDraft>(() => readTasteDraft(userId));

  useEffect(() => {
    writeTasteDraft(userId, draft);
  }, [userId, draft]);

  const markOf = useCallback(
    (key: string): TasteMark => draft[key] ?? serverMark(statuses.get(key)),
    [draft, statuses],
  );

  const toggle = useCallback(
    (key: string) =>
      setDraft((prev) => {
        const current = prev[key] ?? serverMark(statuses.get(key));
        const next = current.watched ? { watched: false, rating: null } : { watched: true, rating: current.rating };
        return { ...prev, [key]: next };
      }),
    [statuses],
  );

  // A rating says you watched it.
  const rate = useCallback(
    (key: string, rating: number | null) =>
      setDraft((prev) => ({ ...prev, [key]: { watched: true, rating } })),
    [],
  );

  const reset = useCallback(() => setDraft({}), []);

  return { draft, markOf, toggle, rate, reset };
};
