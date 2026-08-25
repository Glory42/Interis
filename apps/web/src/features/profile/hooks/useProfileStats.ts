import { useQuery } from "@tanstack/react-query";
import { getDetailedStats } from "@/features/profile/stats-api";

export const profileStatsKeys = {
  detail: (username: string) => ["profile", "stats-detailed", username] as const,
};

export const useDetailedStats = (username: string, enabled = true) =>
  useQuery({
    queryKey: profileStatsKeys.detail(username),
    queryFn: ({ signal }) => getDetailedStats(username, { signal }),
    enabled: enabled && username.trim().length > 0,
  });
