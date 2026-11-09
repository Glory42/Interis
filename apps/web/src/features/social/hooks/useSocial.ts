import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { feedKeys } from "@/features/feed/hooks/useFeed";
import { invalidateFollowingFeed } from "@/features/feed/hooks/feed-cache";
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
import type { MeProfile, PublicProfile } from "@/types/api";

export const socialKeys = {
  all: ["social"] as const,
  followState: (username: string) =>
    ["social", "follow-state", username] as const,
  followers: (username: string) =>
    ["social", "followers", username] as const,
  following: (username: string) =>
    ["social", "following", username] as const,
  // Which of a batch of user ids the viewer follows (useViewerFollows).
  viewerFollowsAll: ["social", "viewer-follows"] as const,
  viewerFollows: (userIdsParam: string) =>
    ["social", "viewer-follows", userIdsParam] as const,
};

// Flips one user in every cached viewer-follows batch that asked about them.
export const setViewerFollowsCache = (
  queryClient: QueryClient,
  userId: string,
  isFollowing: boolean,
): void => {
  queryClient.setQueriesData<string[]>(
    {
      queryKey: socialKeys.viewerFollowsAll,
      predicate: (query) => String(query.queryKey[2]).split(",").includes(userId),
    },
    (old) => {
      if (!old) return old;
      const without = old.filter((id) => id !== userId);
      return isFollowing ? [...without, userId] : without;
    },
  );
};

// The profile page follows by username; its cached profile carries the id.
const syncViewerFollowsByUsername = async (
  queryClient: QueryClient,
  username: string,
  isFollowing: boolean,
): Promise<void> => {
  const userId = queryClient.getQueryData<PublicProfile>(profileKeys.detail(username))?.id;
  if (userId) {
    setViewerFollowsCache(queryClient, userId, isFollowing);
    return;
  }
  await queryClient.invalidateQueries({ queryKey: socialKeys.viewerFollowsAll });
};

export const invalidateSocialDependents = async (
  queryClient: QueryClient,
): Promise<void> => {
  await Promise.all([
    invalidateFollowingFeed(queryClient),
    queryClient.invalidateQueries({ queryKey: feedKeys.meSummary }),
  ]);
};

// A follow shows on both ends: the followed user's follower count and list,
// and the follower's following count and list (#98). `keepFollowingListOnScreen`
// marks the follower's list stale without refetching it, so an unfollowed row
// stays (as "Follow") in an open following dialog until it is reopened.
export const invalidateFollowEdge = async (
  queryClient: QueryClient,
  followerUsername: string | undefined,
  followedUsername: string,
  options: { keepFollowingListOnScreen?: boolean } = {},
): Promise<void> => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: profileKeys.detail(followedUsername) }),
    queryClient.invalidateQueries({ queryKey: socialKeys.followers(followedUsername) }),
    ...(followerUsername
      ? [
          queryClient.invalidateQueries({ queryKey: profileKeys.detail(followerUsername) }),
          queryClient.invalidateQueries({
            queryKey: socialKeys.following(followerUsername),
            refetchType: options.keepFollowingListOnScreen ? "none" : "active",
          }),
        ]
      : []),
  ]);
};

export const viewerUsername = (queryClient: QueryClient) =>
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
        syncViewerFollowsByUsername(queryClient, username, true),
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
        syncViewerFollowsByUsername(queryClient, username, false),
        invalidateSocialDependents(queryClient),
        invalidateFollowEdge(queryClient, viewerUsername(queryClient), username),
      ]);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: followStateKey });
    },
  });
};

export type FollowToggleVariables = {
  userId: string;
  username: string;
  follow: boolean;
};

// Follow/unfollow one person from a list row (follow dialogs). The row flips
// at once through the viewer-follows cache and flips back if the call fails.
export const useFollowToggle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ username, follow }: FollowToggleVariables) =>
      follow ? followUser(username) : unfollowUser(username),
    onMutate: async ({ userId, username, follow }) => {
      await queryClient.cancelQueries({ queryKey: socialKeys.viewerFollowsAll });
      setViewerFollowsCache(queryClient, userId, follow);
      queryClient.setQueryData<FollowState>(socialKeys.followState(username), (old) =>
        old ? { isFollowing: follow } : old,
      );
    },
    onError: async (_error, { userId, username, follow }) => {
      setViewerFollowsCache(queryClient, userId, !follow);
      await queryClient.invalidateQueries({ queryKey: socialKeys.followState(username) });
    },
    onSuccess: async (_data, { username }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: socialKeys.followState(username) }),
        invalidateFollowEdge(queryClient, viewerUsername(queryClient), username, {
          keepFollowingListOnScreen: true,
        }),
        invalidateSocialDependents(queryClient),
      ]);
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
