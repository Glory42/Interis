import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { feedKeys } from "@/features/feed/hooks/useFeed";
import {
  followUser,
  getFollowers,
  getFollowing,
  getIsFollowing,
  removeFollower,
  unfollowUser,
  type FollowState,
  type FollowUser,
} from "@/features/social/api";

export const socialKeys = {
  all: ["social"] as const,
  followState: (username: string) =>
    ["social", "follow-state", username] as const,
  followers: (username: string) =>
    ["social", "followers", username] as const,
  following: (username: string) =>
    ["social", "following", username] as const,
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

export const useFollowers = (username: string, enabled = true) =>
  useQuery({
    queryKey: socialKeys.followers(username),
    queryFn: () => getFollowers(username),
    enabled: enabled && username.trim().length > 0,
  });

export const useFollowing = (username: string, enabled = true) =>
  useQuery({
    queryKey: socialKeys.following(username),
    queryFn: () => getFollowing(username),
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

export const useUnfollowFromList = (profileUsername: string) => {
  const queryClient = useQueryClient();
  const followingKey = socialKeys.following(profileUsername);

  return useMutation({
    mutationFn: (targetUsername: string) => unfollowUser(targetUsername),
    onMutate: async (targetUsername) => {
      await queryClient.cancelQueries({ queryKey: followingKey });
      const prev = queryClient.getQueryData<FollowUser[]>(followingKey);
      queryClient.setQueryData<FollowUser[]>(
        followingKey,
        (old) => old?.filter((u) => u.username !== targetUsername) ?? [],
      );
      return { prev };
    },
    onError: (_error, _variables, context) => {
      if (context?.prev) {
        queryClient.setQueryData(followingKey, context.prev);
      }
    },
    onSuccess: async (_, targetUsername) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: socialKeys.followState(targetUsername) }),
        queryClient.invalidateQueries({ queryKey: ["profile", "detail", profileUsername] }),
        invalidateSocialDependents(queryClient),
      ]);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: followingKey });
    },
  });
};

export const useRemoveFollowerFromList = (profileUsername: string) => {
  const queryClient = useQueryClient();
  const followersKey = socialKeys.followers(profileUsername);

  return useMutation({
    mutationFn: (followerUsername: string) => removeFollower(followerUsername),
    onMutate: async (followerUsername) => {
      await queryClient.cancelQueries({ queryKey: followersKey });
      const prev = queryClient.getQueryData<FollowUser[]>(followersKey);
      queryClient.setQueryData<FollowUser[]>(
        followersKey,
        (old) => old?.filter((u) => u.username !== followerUsername) ?? [],
      );
      return { prev };
    },
    onError: (_error, _variables, context) => {
      if (context?.prev) {
        queryClient.setQueryData(followersKey, context.prev);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile", "detail", profileUsername] });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: followersKey });
    },
  });
};
