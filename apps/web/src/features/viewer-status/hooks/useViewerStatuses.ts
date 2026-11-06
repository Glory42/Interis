import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getViewerStatuses,
  viewerStatusKey,
  type ViewerStatus,
  type ViewerStatusItem,
} from "@/features/viewer-status/api";

// The API caps one lookup at 60 titles.
const MAX_ITEMS = 60;

export const viewerStatusKeys = {
  all: ["viewer-status"] as const,
  items: (itemsParam: string) => ["viewer-status", itemsParam] as const,
};

// One request for a whole grid of cards; pass enabled=false for signed-out visitors.
export const useViewerStatuses = (
  items: ViewerStatusItem[],
  enabled = true,
): Map<string, ViewerStatus> => {
  const itemsParam = useMemo(
    () => [...new Set(items.map(viewerStatusKey))].sort().slice(0, MAX_ITEMS).join(","),
    [items],
  );

  const query = useQuery({
    queryKey: viewerStatusKeys.items(itemsParam),
    queryFn: ({ signal }) => getViewerStatuses(itemsParam, { signal }),
    enabled: enabled && itemsParam.length > 0,
  });

  return useMemo(
    () => new Map((query.data ?? []).map((status) => [viewerStatusKey(status), status])),
    [query.data],
  );
};
