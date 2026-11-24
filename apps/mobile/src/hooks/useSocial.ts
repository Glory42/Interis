import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { followUser, getFollowers, getFollowing, getIsFollowing, unfollowUser } from "@/api/social";
import { getErrorMessage } from "@/api/client";
import { showToast } from "@/lib/toast";
import { profileKeys } from "./useProfile";
import { feedKeys } from "./useFeed";

export const socialKeys = {
  isFollowing: (username: string) => ["social", "is-following", username] as const,
  followers: (username: string) => ["social", "followers", username] as const,
  following: (username: string) => ["social", "following", username] as const,
};

export const useIsFollowing = (username: string, enabled: boolean) =>
  useQuery({
    queryKey: socialKeys.isFollowing(username),
    queryFn: () => getIsFollowing(username),
    enabled,
  });

export const useToggleFollow = (username: string, viewerUsername: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shouldFollow: boolean) =>
      shouldFollow ? followUser(username) : unfollowUser(username),
    onMutate: (shouldFollow) => {
      queryClient.setQueryData(socialKeys.isFollowing(username), shouldFollow);
    },
    onError: (error, shouldFollow) => {
      queryClient.setQueryData(socialKeys.isFollowing(username), !shouldFollow);
      showToast(getErrorMessage(error, "Could not update follow."));
    },
    onSettled: () => {
      const keys = [
        profileKeys.detail(username),
        socialKeys.followers(username),
        // The viewer's following list and feed change too.
        ...(viewerUsername
          ? [profileKeys.detail(viewerUsername), socialKeys.following(viewerUsername)]
          : []),
        feedKeys.following("all"),
      ];
      void Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    },
  });
};

export const useFollowList = (username: string, kind: "followers" | "following") =>
  useQuery({
    queryKey: kind === "followers" ? socialKeys.followers(username) : socialKeys.following(username),
    queryFn: () => (kind === "followers" ? getFollowers(username) : getFollowing(username)),
    enabled: username.length > 0,
  });
