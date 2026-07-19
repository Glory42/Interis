import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { createDiaryEntry, getMyFilmLogs } from "@/features/diary/api";
import { movieKeys } from "@/features/films/hooks/useMovies";
import { profileKeys } from "@/features/profile/hooks/useProfile";
import type { CreateDiaryEntryInput, MeProfile, MovieLog } from "@/types/api";

export const diaryKeys = {
  all: ["diary"] as const,
  myLogs: ["diary", "my-logs"] as const,
};

export const useMyFilmLogs = () =>
  useQuery({
    queryKey: diaryKeys.myLogs,
    queryFn: getMyFilmLogs,
  });

export const useCreateDiaryEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDiaryEntryInput) => createDiaryEntry(input),
    onMutate: async (variables) => {
      const logsKey = movieKeys.logs(variables.tmdbId);
      await queryClient.cancelQueries({ queryKey: logsKey });

      const previousLogs = queryClient.getQueryData<MovieLog[]>(logsKey);
      const me = queryClient.getQueryData<MeProfile | null>(authKeys.me);

      if (!me) {
        return { logsKey, applied: false as const, previousLogs };
      }

      const now = new Date().toISOString();
      const optimisticLog: MovieLog = {
        diaryEntryId: `optimistic-${now}`,
        watchedDate: variables.watchedDate,
        rating: variables.rating ?? null,
        rewatch: variables.rewatch ?? false,
        createdAt: now,
        username: me.username,
        userDisplayName: me.name ?? me.username,
        avatarUrl: me.avatarUrl ?? null,
        reviewContent: variables.review ?? null,
        reviewContainsSpoilers: variables.review ? (variables.containsSpoilers ?? false) : null,
        reviewUpdatedAt: variables.review ? now : null,
      };

      queryClient.setQueryData<MovieLog[]>(logsKey, (old) => [
        optimisticLog,
        ...(old ?? []),
      ]);

      return { logsKey, applied: true as const, previousLogs };
    },
    onError: (_error, _variables, context) => {
      if (!context?.applied) {
        return;
      }

      if (context.previousLogs !== undefined) {
        queryClient.setQueryData(context.logsKey, context.previousLogs);
      } else {
        queryClient.removeQueries({ queryKey: context.logsKey, exact: true });
      }
    },
    onSuccess: async (_data, variables) => {
      const me = queryClient.getQueryData<MeProfile | null>(authKeys.me);
      const tasks = [
        queryClient.invalidateQueries({ queryKey: diaryKeys.myLogs }),
        queryClient.invalidateQueries({ queryKey: movieKeys.logs(variables.tmdbId) }),
        queryClient.invalidateQueries({
          queryKey: ["movies", "detail-view", variables.tmdbId],
        }),
      ];

      if (me?.username) {
        tasks.push(
          queryClient.invalidateQueries({ queryKey: profileKeys.detail(me.username) }),
          queryClient.invalidateQueries({ queryKey: profileKeys.recentActivity(me.username, 20) }),
        );
      }

      await Promise.all(tasks);
    },
  });
};
