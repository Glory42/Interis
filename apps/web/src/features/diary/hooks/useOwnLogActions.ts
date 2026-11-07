import {
  useMutation,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { authKeys } from "@/features/auth/hooks/useAuth";
import {
  deleteDiaryEntry,
  updateDiaryEntry,
  type UpdateDiaryEntryInput,
} from "@/features/diary/api";
import { diaryKeys } from "@/features/diary/hooks/useDiary";
import { invalidateFollowingFeed } from "@/features/feed/hooks/feed-cache";
import { interactionKeys } from "@/features/interactions/hooks/useInteractions";
import { filmKeys } from "@/features/films/hooks/useFilms";
import { profileKeys } from "@/features/profile/hooks/useProfile";
import { deleteSeriesLog, updateSeriesLog } from "@/features/tv/api";
import { seriesKeys } from "@/features/tv/hooks/tv/query-keys";
import type { MeProfile } from "@/types/api";

// One of the viewer's own logs: a movie log or a series log.
export type OwnLog = {
  id: string;
  mediaType: "movie" | "tv";
  tmdbId: number;
};

// Everything that shows the log: the viewer's diary and profile counts,
// the title's page and logs list, and the feeds.
export const invalidateOwnLogQueries = async (queryClient: QueryClient, log: OwnLog) => {
  const me = queryClient.getQueryData<MeProfile | null>(authKeys.me);
  const keys: QueryKey[] =
    log.mediaType === "movie"
      ? [
          diaryKeys.myLogs,
          filmKeys.logs(log.tmdbId),
          filmKeys.detailViewRoot(log.tmdbId),
          interactionKeys.detail(log.tmdbId),
        ]
      : [
          seriesKeys.myLogs,
          seriesKeys.logs(log.tmdbId),
          seriesKeys.detailViewRoot(log.tmdbId),
          seriesKeys.detail(log.tmdbId),
          seriesKeys.interaction(log.tmdbId),
          seriesKeys.seasonDetailRoot(log.tmdbId),
        ];

  if (me?.username) {
    keys.push(
      profileKeys.diary(me.username),
      profileKeys.detail(me.username),
      profileKeys.recentActivity(me.username, 20),
    );
  }

  await Promise.all([
    ...keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    invalidateFollowingFeed(queryClient),
  ]);
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
    onSuccess: (_data, { log }) => invalidateOwnLogQueries(queryClient, log),
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
    onSuccess: (_data, { log }) => invalidateOwnLogQueries(queryClient, log),
  });
};
