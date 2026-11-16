import { queryOptions, useQuery } from "@tanstack/react-query";
import { getUpNext } from "@/features/tv/api";
import { seriesKeys } from "./query-keys";

// TMDB-backed and fanned out per series, so it stays fresh a while; a mark-watched
// refreshes it, and coming back to the tab (after an episode) refetches it.
const UP_NEXT_STALE_TIME_MS = 5 * 60_000;

export const upNextQueryOptions = () =>
  queryOptions({
    queryKey: seriesKeys.upNext,
    queryFn: ({ signal }) => getUpNext({ signal }),
    staleTime: UP_NEXT_STALE_TIME_MS,
    refetchOnWindowFocus: true,
  });

export const useUpNext = (enabled = true) => useQuery({ ...upNextQueryOptions(), enabled });
