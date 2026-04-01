import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { feedKeys } from "@/features/feed/hooks/useFeed";
import {
  followUser,
  getIsFollowing,
  unfollowUser,
  type FollowState,
} from "@/features/social/api";

export const socialKeys = {
  all: ["social"] as const,
  followState: (username: string) =>
    ["social", "follow-state", username] as const,
};

const invalidateSocialDependents = async (
  queryClient: QueryClient,
): Promise<void> => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: feedKeys.following }),
    queryClient.invalidateQueries({ queryKey: feedKeys.meSummary }),
  ]);
};

export const useFollowState = (username: string, enabled = true) =>
  useQuery({
    queryKey: socialKeys.followState(username),
    queryFn: () => getIsFollowing(username),
    enabled: enabled && username.trim().length > 0,
  });

export const useFollowUser = (username: string) => {
  const queryClient = useQueryClient();
  const followStateKey = socialKeys.followState(username);

  return useMutation({
    mutationFn: () => followUser(username),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: followStateKey });

      const previousState = queryClient.getQueryData<FollowState>(followStateKey);
      queryClient.setQueryData<FollowState>(followStateKey, { isFollowing: true });

      return { previousState };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousState) {
        queryClient.setQueryData(followStateKey, context.previousState);
      }
    },
    onSuccess: async () => {
      await invalidateSocialDependents(queryClient);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: followStateKey });
    },
  });
};

export const useUnfollowUser = (username: string) => {
  const queryClient = useQueryClient();
  const followStateKey = socialKeys.followState(username);

  return useMutation({
    mutationFn: () => unfollowUser(username),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: followStateKey });

      const previousState = queryClient.getQueryData<FollowState>(followStateKey);
      queryClient.setQueryData<FollowState>(followStateKey, { isFollowing: false });

      return { previousState };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousState) {
        queryClient.setQueryData(followStateKey, context.previousState);
      }
    },
    onSuccess: async () => {
      await invalidateSocialDependents(queryClient);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: followStateKey });
    },
  });
};
