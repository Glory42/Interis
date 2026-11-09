import { useMemo } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useViewerFollows } from "@/features/social/hooks/useViewerFollows";
import type { ViewerStatus, ViewerStatusItem } from "@/features/viewer-status/api";
import { useViewerStatuses } from "@/features/viewer-status/hooks/useViewerStatuses";
import type { SearchSectionOffset } from "./types";

export type SearchViewerMarks = {
  // Keyed by viewerStatusKey, e.g. "movie:550".
  statuses: Map<string, ViewerStatus>;
  followedIds: Set<string>;
};

// The signed-in viewer's marks for every visible result: one status request
// for all titles, one follow lookup for all members. Nothing for visitors.
export const useSearchViewerMarks = (sectionOffsets: SearchSectionOffset[]): SearchViewerMarks => {
  const { user } = useAuth();
  const viewerId = user?.id ?? null;

  const { titleItems, userIds } = useMemo(() => {
    const entries = sectionOffsets.flatMap(({ section }) => section.items);
    return {
      titleItems: entries.flatMap((entry): ViewerStatusItem[] =>
        entry.kind === "users" ? [] : [{ mediaType: entry.kind === "movie" ? "movie" : "tv", tmdbId: entry.tmdbId }],
      ),
      userIds: entries.flatMap((entry) =>
        entry.kind === "users" && entry.userId !== viewerId ? [entry.userId] : [],
      ),
    };
  }, [sectionOffsets, viewerId]);

  const statuses = useViewerStatuses(titleItems, viewerId !== null);
  const { followedIds } = useViewerFollows(userIds, viewerId !== null);

  return { statuses, followedIds };
};
