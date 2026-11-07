import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteDiaryEntry,
  updateDiaryEntry,
  type UpdateDiaryEntryInput,
} from "@/features/diary/api";
import { refreshAfter, toMediaKind } from "@/features/media/media-refresh";
import { deleteSeriesLog, updateSeriesLog } from "@/features/tv/api";

// One of the viewer's own logs: a movie log or a series log.
export type OwnLog = {
  id: string;
  mediaType: "movie" | "tv";
  tmdbId: number;
};

export const useUpdateOwnLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ log, input }: { log: OwnLog; input: UpdateDiaryEntryInput }) => {
      if (log.mediaType === "movie") {
        await updateDiaryEntry(log.id, input);
        return;
      }
      await updateSeriesLog(log.id, input);
    },
    onSuccess: (_data, { log }) =>
      refreshAfter(queryClient, { type: "log-edited", kind: toMediaKind(log.mediaType), tmdbId: log.tmdbId }),
  });
};

export const useDeleteOwnLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // `unwatch`: also mark the title (and a series' episodes) not watched if
    // this was its last log.
    mutationFn: ({ log, unwatch = false }: { log: OwnLog; unwatch?: boolean }) =>
      log.mediaType === "movie"
        ? deleteDiaryEntry(log.id, { unwatch })
        : deleteSeriesLog(log.id, { unwatch }),
    onSuccess: (_data, { log, unwatch = false }) =>
      refreshAfter(queryClient, {
        type: "log-deleted",
        kind: toMediaKind(log.mediaType),
        tmdbId: log.tmdbId,
        unwatch,
      }),
  });
};
