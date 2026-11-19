import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logMedia, type LogMediaInput } from "@/api/diary";
import { getErrorMessage } from "@/api/client";
import { showToast } from "@/lib/toast";
import type { MediaType } from "@/types/common";
import { movieKeys } from "./useMovies";
import { serialKeys } from "./useSerials";
import { profileKeys } from "./useProfile";
import { feedKeys } from "./useFeed";

export const useLogMedia = (
  mediaType: MediaType,
  tmdbId: number,
  viewerUsername: string | null,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LogMediaInput) => logMedia(mediaType, tmdbId, input),
    onError: (error) => showToast(getErrorMessage(error, "Could not save your log.")),
    onSuccess: () => {
      showToast("Logged to your diary.", "success");
      const keys: (readonly unknown[])[] =
        mediaType === "tv"
          ? [serialKeys.detailRoot(tmdbId), serialKeys.interaction(tmdbId)]
          : [movieKeys.detailRoot(tmdbId), movieKeys.interaction(tmdbId)];
      if (viewerUsername) {
        keys.push(profileKeys.user(viewerUsername));
      }
      keys.push(feedKeys.following("all"));
      return Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    },
  });
};
