import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/features/auth/hooks/useAuth";
import {
  createDiaryEntry,
  deleteDiaryEntry,
  updateDiaryEntry,
  type UpdateDiaryEntryInput,
} from "@/features/diary/api";
import { filmKeys } from "@/features/films/hooks/useFilms";
import { refreshAfter, type MediaTitle } from "@/features/media/media-refresh";
import { createSeriesLog, deleteSeriesLog, updateSeriesLog } from "@/features/tv/api";
import type { FilmLog, MeProfile } from "@/types/api";

export type CreateLogInput = {
  watchedDate: string;
  rating?: number;
  rewatch: boolean;
  review?: string;
  containsSpoilers?: boolean;
};

// Every field optional; `review` text writes the attached Review, null deletes it.
export type UpdateLogInput = UpdateDiaryEntryInput;

type LogRef = MediaTitle & { logId: string };

type OptimisticContext =
  | { applied: false }
  | { applied: true; logsKey: ReturnType<typeof filmKeys.logs>; previousLogs: FilmLog[] | undefined };

const optimisticFilmLog = (input: CreateLogInput, me: MeProfile): FilmLog => {
  const now = new Date().toISOString();
  return {
    diaryEntryId: `optimistic-${now}`,
    watchedDate: input.watchedDate,
    rating: input.rating ?? null,
    rewatch: input.rewatch,
    createdAt: now,
    username: me.username,
    userDisplayName: me.name ?? me.username,
    avatarUrl: me.avatarUrl ?? null,
    reviewContent: input.review ?? null,
    reviewContainsSpoilers: input.review ? (input.containsSpoilers ?? false) : null,
    reviewUpdatedAt: input.review ? now : null,
  };
};

export const useCreateLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, input }: { title: MediaTitle; input: CreateLogInput }): Promise<void> => {
      await (title.kind === "film"
        ? createDiaryEntry({ tmdbId: title.tmdbId, ...input })
        : createSeriesLog(title.tmdbId, input));
    },
    // A Film log shows up in the title's log list before the server answers.
    onMutate: async ({ title, input }): Promise<OptimisticContext> => {
      if (title.kind !== "film") return { applied: false };
      const logsKey = filmKeys.logs(title.tmdbId);
      await queryClient.cancelQueries({ queryKey: logsKey });
      const previousLogs = queryClient.getQueryData<FilmLog[]>(logsKey);
      const me = queryClient.getQueryData<MeProfile | null>(authKeys.me);
      if (!me) return { applied: false };

      queryClient.setQueryData<FilmLog[]>(logsKey, (old) => [optimisticFilmLog(input, me), ...(old ?? [])]);
      return { applied: true, logsKey, previousLogs };
    },
    onError: (_error, _variables, context) => {
      if (!context?.applied) return;
      if (context.previousLogs !== undefined) {
        queryClient.setQueryData(context.logsKey, context.previousLogs);
      } else {
        queryClient.removeQueries({ queryKey: context.logsKey, exact: true });
      }
    },
    onSuccess: (_data, { title, input }) =>
      refreshAfter(queryClient, {
        type: "log-created",
        kind: title.kind,
        tmdbId: title.tmdbId,
        hasReview: Boolean(input.review),
      }),
  });
};

// One request edits the log and its attached Review together.
export const useUpdateLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ log, input }: { log: LogRef; input: UpdateLogInput }) =>
      log.kind === "film" ? updateDiaryEntry(log.logId, input) : updateSeriesLog(log.logId, input),
    onSuccess: (_data, { log }) =>
      refreshAfter(queryClient, { type: "log-edited", kind: log.kind, tmdbId: log.tmdbId }),
  });
};

export const useDeleteLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // `unwatch`: also mark the title (and a Series' episodes) not watched if this was its last log.
    mutationFn: ({ log, unwatch }: { log: LogRef; unwatch: boolean }) =>
      log.kind === "film"
        ? deleteDiaryEntry(log.logId, { unwatch })
        : deleteSeriesLog(log.logId, { unwatch }),
    onSuccess: (_data, { log, unwatch }) =>
      refreshAfter(queryClient, { type: "log-deleted", kind: log.kind, tmdbId: log.tmdbId, unwatch }),
  });
};
