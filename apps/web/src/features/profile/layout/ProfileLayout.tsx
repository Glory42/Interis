import { useState, type ReactNode } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ProfileHeaderCompact } from "@/features/profile/components/ProfileHeaderCompact";
import { ProfileActions } from "@/features/profile/components/ProfileActions";
import { STATS_MIN_LOGS } from "@/features/profile/components/stats/stats-model";
import {
  ProfileTabs,
  type ProfileTab,
} from "@/features/profile/components/ProfileTabs";
import { useUserProfile } from "@/features/profile/hooks/useProfile";
import { FollowListDialog } from "@/features/social/components/FollowListDialog";
import {
  useFollowState,
  useFollowUser,
  useUnfollowUser,
} from "@/features/social/hooks/useSocial";
import {
  useBlockUser,
  useMuteUser,
  useRelationshipState,
  useUnblockUser,
  useUnmuteUser,
} from "@/features/moderation/hooks/useModeration";
import { isApiError } from "@/lib/api-client";
import type { PublicProfile } from "@/types/api";
import { ProfileHeaderSkeleton } from "@/components/ui/PageSkeletons";

type ProfileLayoutProps = {
  username: string;
  activeTab: ProfileTab;
  children: ReactNode | ((profile: PublicProfile) => ReactNode);
};

export const ProfileLayout = ({
  username,
  activeTab,
  children,
}: ProfileLayoutProps) => {
  const { user, isUserLoading } = useAuth();
  const profileQuery = useUserProfile(username);
  const [followError, setFollowError] = useState<{
    username: string;
    message: string;
  } | null>(null);
  const [followListDialog, setFollowListDialog] = useState<
    "followers" | "following" | null
  >(null);

  const isViewerLoggedIn = Boolean(user);
  const isOwnProfileByRoute =
    user !== null && user.username.toLowerCase() === username.toLowerCase();

  const followStateQuery = useFollowState(
    username,
    isViewerLoggedIn && !isOwnProfileByRoute,
  );
  const followMutation = useFollowUser(username);
  const unfollowMutation = useUnfollowUser(username);

  const relationshipStateQuery = useRelationshipState(
    username,
    isViewerLoggedIn && !isOwnProfileByRoute,
  );
  const blockMutation = useBlockUser(username);
  const unblockMutation = useUnblockUser(username);
  const muteMutation = useMuteUser(username);
  const unmuteMutation = useUnmuteUser(username);

  if (profileQuery.isPending) {
    return <ProfileHeaderSkeleton />;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="mx-auto flex min-h-[55vh] w-full max-w-6xl items-center px-4 py-8">
        <div className=" border border-border/60 bg-card/40 p-4 text-sm text-muted-foreground">
          This user does not exist or cannot be loaded right now.
        </div>
      </div>
    );
  }

  const profile = profileQuery.data;
  const isOwnProfile =
    user !== null &&
    user.username.toLowerCase() === profile.username.toLowerCase();

  const isFollowActionPending =
    followMutation.isPending || unfollowMutation.isPending;
  const isFollowing = followStateQuery.data?.isFollowing ?? false;

  const handleToggleFollow = async () => {
    setFollowError(null);

    try {
      if (isFollowing) {
        await unfollowMutation.mutateAsync();
        return;
      }

      await followMutation.mutateAsync();
    } catch (error) {
      setFollowError({
        username: profile.username,
        message: isApiError(error)
          ? error.message
          : "Could not update follow status right now.",
      });
    }
  };

  const isBlocked = relationshipStateQuery.data?.isBlocked ?? false;
  const isMuted = relationshipStateQuery.data?.isMuted ?? false;
  const isBlockActionPending = blockMutation.isPending || unblockMutation.isPending;
  const isMuteActionPending = muteMutation.isPending || unmuteMutation.isPending;

  const handleToggleBlock = () => {
    if (isBlocked) {
      unblockMutation.mutate();
      return;
    }
    blockMutation.mutate();
  };

  const handleToggleMute = () => {
    if (isMuted) {
      unmuteMutation.mutate();
      return;
    }
    muteMutation.mutate();
  };

  const profileHeaderAction = isUserLoading ? null : (
    <ProfileActions
      mode={isOwnProfile ? "owner" : isViewerLoggedIn ? "viewer" : "guest"}
      username={profile.username}
      isFollowing={isFollowing}
      isMuted={isMuted}
      isBlocked={isBlocked}
      isBusy={
        followStateQuery.isPending ||
        relationshipStateQuery.isPending ||
        isFollowActionPending ||
        isMuteActionPending ||
        isBlockActionPending
      }
      onToggleFollow={() => void handleToggleFollow()}
      onToggleMute={handleToggleMute}
      onToggleBlock={handleToggleBlock}
    />
  );

  const entryCount = (profile.stats?.movieEntryCount ?? 0) + (profile.stats?.serialEntryCount ?? 0);
  const followerCount = profile.stats?.followerCount ?? 0;
  const followingCount = profile.stats?.followingCount ?? 0;
  const reviewCount = profile.stats?.reviewCount ?? 0;
  return (
    <div className="min-h-screen shell">
      <FollowListDialog
        isOpen={followListDialog !== null}
        onClose={() => setFollowListDialog(null)}
        mode={followListDialog ?? "followers"}
        profileUsername={profile.username}
        isOwnProfile={isOwnProfile}
      />

      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="mb-5">
          <ProfileHeaderCompact
            key={profile.username}
            profile={profile}
            headerAction={profileHeaderAction}
            actionError={
              isOwnProfile || followError?.username !== profile.username
                ? null
                : followError.message
            }
            stats={{
              logged: entryCount,
              reviews: reviewCount,
              followers: followerCount,
              following: followingCount,
            }}
            onFollowingClick={() => setFollowListDialog("following")}
            onFollowersClick={() => setFollowListDialog("followers")}
          />
        </div>

        <ProfileTabs
          username={username}
          activeTab={activeTab}
          hideStats={!isOwnProfile && entryCount < STATS_MIN_LOGS && activeTab !== "stats"}
        />

        <div className="mt-8">
          {typeof children === "function" ? children(profile) : children}
        </div>
      </div>
    </div>
  );
};
