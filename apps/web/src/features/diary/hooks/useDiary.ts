import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { invalidateFollowingFeed } from "@/features/feed/hooks/feed-cache.helper";
import { createDiaryEntry, getMyFilmLogs } from "@/features/diary/api";
import { interactionKeys } from "@/features/interactions/hooks/useInteractions";
import { filmKeys } from "@/features/films/hooks/useFilms";
import { profileKeys } from "@/features/profile/hooks/useProfile";
import { profileStatsKeys } from "@/features/profile/hooks/useProfileStats";
import type { CreateDiaryEntryInput, MeProfile, FilmLog } from "@/types/api";

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
      const logsKey = filmKeys.logs(variables.tmdbId);
      await queryClient.cancelQueries({ queryKey: logsKey });

      const previousLogs = queryClient.getQueryData<FilmLog[]>(logsKey);
      const me = queryClient.getQueryData<MeProfile | null>(authKeys.me);

      if (!me) {
        return { logsKey, applied: false as const, previousLogs };
      }

      const now = new Date().toISOString();
      const optimisticLog: FilmLog = {
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

      queryClient.setQueryData<FilmLog[]>(logsKey, (old) => [
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
        queryClient.invalidateQueries({ queryKey: filmKeys.logs(variables.tmdbId) }),
        queryClient.invalidateQueries({
          queryKey: filmKeys.detailViewRoot(variables.tmdbId),
        }),
        // Logging marks the movie watched and a rated log sets "Your rating".
        queryClient.invalidateQueries({ queryKey: interactionKeys.detail(variables.tmdbId) }),
        invalidateFollowingFeed(queryClient),
      ];

      // The log shows in the viewer's diary and stats, and logging takes the
      // movie off their watchlist (#95).
      if (me?.username) {
        tasks.push(
          ...[
            profileKeys.detail(me.username),
            profileKeys.diary(me.username),
            profileKeys.watchlist(me.username),
            profileKeys.recentActivity(me.username, 20),
            profileStatsKeys.detail(me.username),
          ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
        );
      }

      await Promise.all(tasks);
    },
  });
};
