import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { feedKeys } from "@/features/feed/hooks/useFeed";
import { clearWatchGoal, getWatchGoal, setWatchGoal, type SetWatchGoalInput } from "@/features/profile/goal-api";
import type { MeProfile } from "@/types/api";

export const watchGoalKeys = {
  // Every year of one user's goals: each year's response lists the years with goals.
  user: (username: string) => ["profile", "watch-goal", username] as const,
  detail: (username: string, year: number) => ["profile", "watch-goal", username, year] as const,
};

// The year a log dated `watchedDate` ("YYYY-MM-DD") counts toward.
export const goalYearOf = (watchedDate: string): number => Number(watchedDate.slice(0, 4));

export const useWatchGoal = (username: string, year: number, enabled = true) =>
  useQuery({
    queryKey: watchGoalKeys.detail(username, year),
    queryFn: ({ signal }) => getWatchGoal(username, year, { signal }),
    enabled: enabled && username.trim().length > 0,
  });

const useRefreshMyGoals = () => {
  const queryClient = useQueryClient();
  return () => {
    const username = queryClient.getQueryData<MeProfile | null>(authKeys.me)?.username;
    return Promise.all([
      username ? queryClient.invalidateQueries({ queryKey: watchGoalKeys.user(username) }) : null,
      queryClient.invalidateQueries({ queryKey: feedKeys.meSummary }),
    ]);
  };
};

export const useSetWatchGoal = () => {
  const refresh = useRefreshMyGoals();
  return useMutation({
    mutationFn: ({ year, input }: { year: number; input: SetWatchGoalInput }) => setWatchGoal(year, input),
    onSuccess: refresh,
  });
};

export const useClearWatchGoal = () => {
  const refresh = useRefreshMyGoals();
  return useMutation({
    mutationFn: (year: number) => clearWatchGoal(year),
    onSuccess: refresh,
  });
};
