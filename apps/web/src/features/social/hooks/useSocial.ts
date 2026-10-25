import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { feedKeys } from "@/features/feed/hooks/useFeed";
import { invalidateFollowingFeed } from "@/features/feed/hooks/feed-cache.helper";
import { profileKeys } from "@/features/profile/hooks/useProfile";
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
import type { MeProfile } from "@/types/api";

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
    invalidateFollowingFeed(queryClient),
    queryClient.invalidateQueries({ queryKey: feedKeys.meSummary }),
  ]);
};

// A follow shows on both ends: the followed user's follower count and list,
// and the follower's following count and list (#98).
const invalidateFollowEdge = async (
  queryClient: QueryClient,
  followerUsername: string | undefined,
  followedUsername: string,
): Promise<void> => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: profileKeys.detail(followedUsername) }),
    queryClient.invalidateQueries({ queryKey: socialKeys.followers(followedUsername) }),
    ...(followerUsername
      ? [
          queryClient.invalidateQueries({ queryKey: profileKeys.detail(followerUsername) }),
          queryClient.invalidateQueries({ queryKey: socialKeys.following(followerUsername) }),
        ]
      : []),
  ]);
};

const viewerUsername = (queryClient: QueryClient) =>
  queryClient.getQueryData<MeProfile | null>(authKeys.me)?.username;

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
      await Promise.all([
        invalidateSocialDependents(queryClient),
        invalidateFollowEdge(queryClient, viewerUsername(queryClient), username),
      ]);
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
      await Promise.all([
        invalidateSocialDependents(queryClient),
        invalidateFollowEdge(queryClient, viewerUsername(queryClient), username),
      ]);
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
        invalidateFollowEdge(queryClient, profileUsername, targetUsername),
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
    onSuccess: async (_, followerUsername) => {
      await invalidateFollowEdge(queryClient, followerUsername, profileUsername);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: followersKey });
    },
  });
};
