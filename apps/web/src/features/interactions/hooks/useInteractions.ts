import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { authKeys } from "@/features/auth/hooks/useAuth";
import {
  getMovieInteraction,
  updateMovieInteraction,
  type MovieInteraction,
  type UpdateMovieInteractionInput,
} from "@/features/interactions/api";
import { movieKeys } from "@/features/movies/hooks/useMovies";
import { invalidateFollowingFeed } from "@/features/feed/hooks/feed-cache.helper";
import { profileKeys } from "@/features/profile/hooks/useProfile";
import { profileStatsKeys } from "@/features/profile/hooks/useProfileStats";
import type { MeProfile } from "@/types/api";

export const interactionKeys = {
  detail: (tmdbId: number) => ["interactions", "movie", tmdbId] as const,
};

// The viewer's profile pages a movie interaction shows up on (#96): its
// counts and stats always, the liked tab for a like, the watchlist for any
// change (liking, rating or watching also takes a movie off it), and recent
// activity for the like and watchlist feed rows.
const viewerProfileKeys = (username: string, input: UpdateMovieInteractionInput): QueryKey[] => [
  profileKeys.detail(username),
  profileStatsKeys.detail(username),
  profileKeys.watchlist(username),
  ...(input.liked !== undefined ? [profileKeys.likes(username)] : []),
  ...(input.liked !== undefined || input.watchlisted !== undefined
    ? [profileKeys.recentActivity(username, 20)]
    : []),
];

export const useMovieInteraction = (tmdbId: number, enabled = true) =>
  useQuery({
    queryKey: interactionKeys.detail(tmdbId),
    queryFn: () => getMovieInteraction(tmdbId),
    enabled,
  });

export const useUpdateMovieInteraction = (tmdbId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { errorToast: "Couldn't update this movie" },
    mutationFn: (input: UpdateMovieInteractionInput) =>
      updateMovieInteraction(tmdbId, input),
    onMutate: async (input) => {
      const queryKey = interactionKeys.detail(tmdbId);
      await queryClient.cancelQueries({ queryKey });

      const previousState = queryClient.getQueryData<MovieInteraction>(queryKey);
      if (previousState) {
        // Any rating/like interaction implicitly watched: true
        const isImplicitlyWatched =
          input.liked === true ||
          (input.rating !== undefined && input.rating !== null);

        queryClient.setQueryData<MovieInteraction>(queryKey, {
          ...previousState,
          ...(input.liked !== undefined ? { liked: input.liked } : {}),
          ...(input.watchlisted !== undefined
            ? { watchlisted: input.watchlisted }
            : {}),
          ...(input.rating !== undefined
            ? { rating: input.rating }
            : {}),
          ...(input.watched !== undefined ? { watched: input.watched } : {}),
          ...(isImplicitlyWatched ? { watched: true } : {}),
        });
      }

      return { previousState };
    },
    onError: (_error, _input, context) => {
      if (!context?.previousState) {
        return;
      }

      queryClient.setQueryData(
        interactionKeys.detail(tmdbId),
        context.previousState,
      );
    },
    onSettled: async (_data, _error, input) => {
      const me = queryClient.getQueryData<MeProfile | null>(authKeys.me);
      await Promise.all([
        ...(me?.username ? viewerProfileKeys(me.username, input) : []).map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
        queryClient.invalidateQueries({
          queryKey: interactionKeys.detail(tmdbId),
        }),
        queryClient.invalidateQueries({
          queryKey: movieKeys.detail(tmdbId),
        }),
        // Prefix-matches every reviewsSort variant for this movie only.
        queryClient.invalidateQueries({
          queryKey: movieKeys.detailViewRoot(tmdbId),
        }),
        queryClient.invalidateQueries({
          queryKey: movieKeys.logs(tmdbId),
        }),
        // Likes and watchlist adds are feed rows, and undoing them removes
        // the row server-side (#76).
        invalidateFollowingFeed(queryClient),
      ]);
    },
  });
};
