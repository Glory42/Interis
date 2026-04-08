import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ProfileHeaderCompact } from "@/features/profile/components/ProfileHeaderCompact";
import {
  ProfileTabs,
  type ProfileTab,
} from "@/features/profile/components/ProfileTabs";
import { useUserProfile } from "@/features/profile/hooks/useProfile";
import {
  useFollowState,
  useFollowUser,
  useUnfollowUser,
} from "@/features/social/hooks/useSocial";
import { formatJoinedDate } from "@/features/profile/utils/profile.utils";
import { isApiError } from "@/lib/api-client";
import type { PublicProfile } from "@/types/api";

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

  const isViewerLoggedIn = Boolean(user);
  const isOwnProfileByRoute =
    user !== null && user.username.toLowerCase() === username.toLowerCase();

  const followStateQuery = useFollowState(
    username,
    isViewerLoggedIn && !isOwnProfileByRoute,
  );
  const followMutation = useFollowUser(username);
  const unfollowMutation = useUnfollowUser(username);

  if (profileQuery.isPending) {
    return (
      <div className="mx-auto flex min-h-[55vh] w-full max-w-6xl items-center px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner /> Loading profile...
        </div>
      </div>
    );
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

  const actionClassName =
    "flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] transition-colors profile-shell-border profile-shell-muted hover:text-foreground";

  const profileHeaderAction = isUserLoading ? null : isOwnProfile ? (
    <Link
      to="/settings/profile"
      className={actionClassName}
      aria-label="Open settings"
    >
      <Settings className="h-3 w-3" aria-hidden="true" />
    </Link>
  ) : isViewerLoggedIn ? (
    <button
      type="button"
      className={actionClassName}
      disabled={followStateQuery.isPending || isFollowActionPending}
      onClick={() => {
        void handleToggleFollow();
      }}
      aria-label="Follow user"
    >
      {followStateQuery.isPending
        ? "Loading"
        : isFollowActionPending
          ? "Saving"
          : isFollowing
            ? "Following"
            : "Follow"}
    </button>
  ) : (
    <Link
      to="/login"
      search={{
        redirect: `/profile/${profile.username}`,
      }}
      className={actionClassName}
    >
      Follow
    </Link>
  );

  const joinedShortLabel = formatJoinedDate(profile.createdAt, "short");

  const entryCount = profile.stats?.entryCount ?? 0;
  const followerCount = profile.stats?.followerCount ?? 0;
  const followingCount = profile.stats?.followingCount ?? 0;
  const reviewCount = profile.stats?.reviewCount ?? 0;
  return (
    <div className="min-h-screen profile-shell">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="mb-8 border-b pb-8 profile-shell-border">
          <ProfileHeaderCompact
            key={profile.username}
            profile={profile}
            joinedLabel={joinedShortLabel}
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
          />
        </div>

        <ProfileTabs username={username} activeTab={activeTab} />

        <div>
          {typeof children === "function" ? children(profile) : children}
        </div>
      </div>
    </div>
  );
};
