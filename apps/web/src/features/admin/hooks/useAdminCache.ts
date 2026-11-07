import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCacheSummary, purgeUnreferenced, refreshOldest } from "@/features/admin/cache-api";

const cacheKey = ["admin", "cache"] as const;

// Counted on open or Refresh only.
export const useCacheSummary = () => useQuery({ queryKey: cacheKey, queryFn: getCacheSummary });

const useCacheAction = <TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cacheKey }),
  });
};

export const useRefreshOldest = () => useCacheAction(refreshOldest);
export const usePurgeUnreferenced = () => useCacheAction(purgeUnreferenced);
