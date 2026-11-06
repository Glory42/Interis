import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateFollowingFeed } from "@/features/feed/hooks/feed-cache.helper";
import {
  blockUser,
  getBlockedUsers,
  getMutedUsers,
  getRelationshipState,
  MODERATION_PAGE_SIZE,
  type ModeratedUser,
  muteUser,
  unblockUser,
  unmuteUser,
  type RelationshipState,
} from "@/features/moderation/api";
import { socialKeys } from "@/features/social/hooks/useSocial";

export const moderationKeys = {
  relationshipState: (username: string) =>
    ["moderation", "state", username] as const,
  blocked: ["moderation", "blocked"] as const,
  muted: ["moderation", "muted"] as const,
};

export const useRelationshipState = (username: string, enabled = true) =>
  useQuery({
    queryKey: moderationKeys.relationshipState(username),
    queryFn: () => getRelationshipState(username),
    enabled: enabled && username.trim().length > 0,
  });

const useModeratedUsersList = (
  queryKey: readonly string[],
  fetchPage: (offset: number) => Promise<ModeratedUser[]>,
  enabled: boolean,
) =>
  useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < MODERATION_PAGE_SIZE ? undefined : allPages.length * MODERATION_PAGE_SIZE,
    select: (data) => data.pages.flat(),
    enabled,
  });

export const useBlockedUsers = (enabled = true) =>
  useModeratedUsersList(moderationKeys.blocked, getBlockedUsers, enabled);

export const useMutedUsers = (enabled = true) =>
  useModeratedUsersList(moderationKeys.muted, getMutedUsers, enabled);

export const useBlockUser = (username: string) => {
  const queryClient = useQueryClient();
  const stateKey = moderationKeys.relationshipState(username);

  return useMutation({
    mutationFn: () => blockUser(username),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: stateKey });
      const previous = queryClient.getQueryData<RelationshipState>(stateKey);
      queryClient.setQueryData<RelationshipState>(stateKey, {
        isBlocked: true,
        isMuted: false,
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(stateKey, context.previous);
      }
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: stateKey }),
        queryClient.invalidateQueries({ queryKey: socialKeys.followState(username) }),
        queryClient.invalidateQueries({ queryKey: moderationKeys.blocked }),
        invalidateFollowingFeed(queryClient),
      ]);
    },
  });
};

export const useUnblockUser = (username: string) => {
  const queryClient = useQueryClient();
  const stateKey = moderationKeys.relationshipState(username);

  return useMutation({
    mutationFn: () => unblockUser(username),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: stateKey });
      const previous = queryClient.getQueryData<RelationshipState>(stateKey);
      queryClient.setQueryData<RelationshipState>(stateKey, (old) => ({
        isBlocked: false,
        isMuted: old?.isMuted ?? false,
      }));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(stateKey, context.previous);
      }
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: stateKey }),
        queryClient.invalidateQueries({ queryKey: moderationKeys.blocked }),
        invalidateFollowingFeed(queryClient),
      ]);
    },
  });
};

export const useMuteUser = (username: string) => {
  const queryClient = useQueryClient();
  const stateKey = moderationKeys.relationshipState(username);

  return useMutation({
    mutationFn: () => muteUser(username),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: stateKey });
      const previous = queryClient.getQueryData<RelationshipState>(stateKey);
      queryClient.setQueryData<RelationshipState>(stateKey, (old) => ({
        isBlocked: old?.isBlocked ?? false,
        isMuted: true,
      }));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(stateKey, context.previous);
      }
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: stateKey }),
        queryClient.invalidateQueries({ queryKey: moderationKeys.muted }),
        invalidateFollowingFeed(queryClient),
      ]);
    },
  });
};

export const useUnmuteUser = (username: string) => {
  const queryClient = useQueryClient();
  const stateKey = moderationKeys.relationshipState(username);

  return useMutation({
    mutationFn: () => unmuteUser(username),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: stateKey });
      const previous = queryClient.getQueryData<RelationshipState>(stateKey);
      queryClient.setQueryData<RelationshipState>(stateKey, (old) => ({
        isBlocked: old?.isBlocked ?? false,
        isMuted: false,
      }));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(stateKey, context.previous);
      }
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: stateKey }),
        queryClient.invalidateQueries({ queryKey: moderationKeys.muted }),
        invalidateFollowingFeed(queryClient),
      ]);
    },
  });
};
