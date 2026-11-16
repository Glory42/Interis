import { useQuery } from "@tanstack/react-query";
import { getFollowSuggestions } from "@/features/social/api";
import { socialKeys } from "@/features/social/hooks/useSocial";

// Held steady while open: following someone flips their row, it doesn't reshuffle the list.
export const useFollowSuggestions = (limit: number, enabled = true) =>
  useQuery({
    queryKey: socialKeys.suggestions(limit),
    queryFn: ({ signal }) => getFollowSuggestions(limit, { signal }),
    enabled,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
