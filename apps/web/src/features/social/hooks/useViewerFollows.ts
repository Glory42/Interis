import { useMemo } from "react";
import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { getViewerFollows, VIEWER_FOLLOWS_MAX_IDS } from "@/features/social/api";
import { socialKeys } from "@/features/social/hooks/useSocial";

export type ViewerFollows = {
  // Ids (of those asked about) the viewer follows.
  followedIds: Set<string>;
  // False until every batch has answered, so toggles don't guess.
  isLoaded: boolean;
};

const toChunkParams = (userIds: string[]): string[] => {
  const ids = [...new Set(userIds)].sort();
  const params: string[] = [];
  for (let start = 0; start < ids.length; start += VIEWER_FOLLOWS_MAX_IDS) {
    params.push(ids.slice(start, start + VIEWER_FOLLOWS_MAX_IDS).join(","));
  }
  return params;
};

// Stable primitive result so callers re-render only when the answer changes.
const combineResults = (results: UseQueryResult<string[]>[]) => ({
  followedParam: results.flatMap((result) => result.data ?? []).sort().join(","),
  isLoaded: results.every((result) => result.data !== undefined),
});

// One request per 60 ids (usually just one); pass enabled=false for signed-out visitors.
export const useViewerFollows = (userIds: string[], enabled = true): ViewerFollows => {
  const chunkParams = useMemo(() => toChunkParams(userIds), [userIds]);

  const { followedParam, isLoaded } = useQueries({
    queries: chunkParams.map((param) => ({
      queryKey: socialKeys.viewerFollows(param),
      queryFn: ({ signal }: { signal: AbortSignal }) => getViewerFollows(param, { signal }),
      enabled,
    })),
    combine: combineResults,
  });

  const followedIds = useMemo(
    () => new Set(followedParam ? followedParam.split(",") : []),
    [followedParam],
  );

  return { followedIds, isLoaded: enabled && isLoaded };
};
