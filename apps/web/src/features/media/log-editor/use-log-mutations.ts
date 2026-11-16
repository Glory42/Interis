import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { authKeys } from "@/features/auth/hooks/useAuth";
import {
  createDiaryEntry,
  deleteDiaryEntry,
  updateDiaryEntry,
  type UpdateDiaryEntryInput,
} from "@/features/diary/api";
import { diaryKeys } from "@/features/diary/hooks/diary-keys";
import { filmKeys } from "@/features/films/hooks/useFilms";
import { refreshAfter, type MediaTitle } from "@/features/media/media-cache";
import { goalYearOf } from "@/features/profile/hooks/useWatchGoal";
import { reviewDetailFilter } from "@/features/reviews/hooks/review-keys";
import { createSeriesLog, deleteSeriesLog, updateSeriesLog } from "@/features/tv/api";
import type { FilmLog, MeProfile } from "@/types/api";

export type CreateLogInput = {
  watchedDate: string;
  rating?: number;
  rewatch: boolean;
  review?: string;
  containsSpoilers?: boolean;
  note?: string;
  tags?: string[];
};

// Every field optional; `review` text writes the attached Review, null deletes it.
export type UpdateLogInput = UpdateDiaryEntryInput;

// `review`: the Review written with the log, whose detail page shows the log's rating.
type LogRef = MediaTitle & { logId: string; watchedDate?: string; review?: { id: string } | null };

// The goal years a log write moves between; undefined when the log's date isn't known here.
const goalYearsOf = (...dates: (string | undefined)[]): number[] | undefined =>
  dates[0] === undefined ? undefined : [...new Set(dates.filter((date) => date !== undefined).map(goalYearOf))];

const refreshAttachedReview = (queryClient: QueryClient, log: LogRef) =>
  log.review ? queryClient.invalidateQueries(reviewDetailFilter(log.review.id)) : null;

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
        goalYears: goalYearsOf(input.watchedDate),
      }),
  });
};

// One request edits the log and its attached Review together.
export const useUpdateLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ log, input }: { log: LogRef; input: UpdateLogInput }) =>
      log.kind === "film" ? updateDiaryEntry(log.logId, input) : updateSeriesLog(log.logId, input),
    onSuccess: (_data, { log, input }) =>
      Promise.all([
        refreshAfter(queryClient, {
          type: "log-edited",
          kind: log.kind,
          tmdbId: log.tmdbId,
          goalYears: goalYearsOf(log.watchedDate, input.watchedDate),
        }),
        // Emptied review text deleted the Review; its page is left, not refetched.
        input.review === null ? null : refreshAttachedReview(queryClient, log),
        input.note !== undefined || input.tags !== undefined
          ? queryClient.invalidateQueries({ queryKey: diaryKeys.privateFields(log.kind, log.logId), exact: true })
          : null,
      ]),
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
      Promise.all([
        refreshAfter(queryClient, {
          type: "log-deleted",
          kind: log.kind,
          tmdbId: log.tmdbId,
          unwatch,
          goalYears: goalYearsOf(log.watchedDate),
        }),
        refreshAttachedReview(queryClient, log),
      ]),
  });
};
