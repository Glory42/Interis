import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { createDiaryEntry, getMyFilmLogs } from "@/features/diary/api";
import { diaryKeys } from "@/features/diary/hooks/diary-keys";
import { filmKeys } from "@/features/films/hooks/useFilms";
import { refreshAfter } from "@/features/media/media-refresh";
import type { CreateDiaryEntryInput, MeProfile, FilmLog } from "@/types/api";

export { diaryKeys };

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
    onSuccess: (_data, variables) =>
      refreshAfter(queryClient, {
        type: "log-created",
        kind: "film",
        tmdbId: variables.tmdbId,
        hasReview: Boolean(variables.review),
      }),
  });
};
