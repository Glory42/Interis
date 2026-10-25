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
import { invalidateFollowingFeed } from "@/features/feed/hooks/feed-cache.helper";
import { interactionKeys } from "@/features/interactions/hooks/useInteractions";
import { movieKeys } from "@/features/movies/hooks/useMovies";
import { profileKeys } from "@/features/profile/hooks/useProfile";
import { deleteSerialLog, updateSerialLog } from "@/features/serials/api";
import { serialKeys } from "@/features/serials/hooks/serials/query-keys";
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
          movieKeys.logs(log.tmdbId),
          movieKeys.detailViewRoot(log.tmdbId),
          interactionKeys.detail(log.tmdbId),
        ]
      : [
          serialKeys.myLogs,
          serialKeys.logs(log.tmdbId),
          serialKeys.detailViewRoot(log.tmdbId),
          serialKeys.detail(log.tmdbId),
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
      await updateSerialLog(log.id, input);
    },
    onSuccess: (_data, { log }) => invalidateOwnLogQueries(queryClient, log),
  });
};

export const useDeleteOwnLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // `unwatch`: also mark the title not watched if this was its last log.
    mutationFn: ({ log, unwatch = false }: { log: OwnLog; unwatch?: boolean }) =>
      log.mediaType === "movie"
        ? deleteDiaryEntry(log.id, { unwatch })
        : deleteSerialLog(log.id),
    onSuccess: (_data, { log }) => invalidateOwnLogQueries(queryClient, log),
  });
};
