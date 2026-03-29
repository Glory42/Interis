import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ProfileHero } from "@/features/profile/components/ProfileHero";
import { ProfileSidebar } from "@/features/profile/components/ProfileSidebar";
import { ProfileStatsGrid } from "@/features/profile/components/ProfileStatsGrid";
import { ProfileTabs, type ProfileTab } from "@/features/profile/components/ProfileTabs";
import { useUserFilms, useUserProfile } from "@/features/profile/hooks/useProfile";
import { useFollowState, useFollowUser, useUnfollowUser } from "@/features/social/hooks/useSocial";
import {
  formatJoinedDate,
  getLatestWatchedDate,
  getRelativeTime,
} from "@/features/profile/utils/profile.utils";
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
  const userFilmsQuery = useUserFilms(username);
  const [followError, setFollowError] = useState<
    { username: string; message: string } | null
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
        <div className="rounded-2xl border border-border/60 bg-card/40 p-4 text-sm text-muted-foreground">
          This user does not exist or cannot be loaded right now.
        </div>
      </div>
    );
  }

  const profile = profileQuery.data;
  const isOwnProfile =
    user !== null && user.username.toLowerCase() === profile.username.toLowerCase();

  const isFollowActionPending = followMutation.isPending || unfollowMutation.isPending;
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
      setFollowError(
        {
          username: profile.username,
          message: isApiError(error)
            ? error.message
            : "Could not update follow status right now.",
        },
      );
    }
  };

  const profileHeaderAction = isUserLoading ? null : isOwnProfile ? (
    <Button
      asChild
      size="sm"
      variant="ghost"
      className="h-8 rounded-full border border-border/60 bg-background/35 px-3 text-xs text-muted-foreground hover:text-foreground"
    >
      <Link to="/settings/profile">Settings</Link>
    </Button>
  ) : isViewerLoggedIn ? (
    <Button
      type="button"
      size="sm"
      variant={isFollowing ? "outline" : "secondary"}
      className="h-8 rounded-full px-3 text-xs"
      disabled={followStateQuery.isPending || isFollowActionPending}
      onClick={() => {
        void handleToggleFollow();
      }}
    >
      {followStateQuery.isPending
        ? "Loading..."
        : isFollowActionPending
          ? "Saving..."
          : isFollowing
            ? "Following"
            : "Follow"}
    </Button>
  ) : (
    <Button asChild size="sm" variant="outline" className="h-8 rounded-full px-3 text-xs">
      <Link
        to="/login"
        search={{
          redirect: `/profile/${profile.username}`,
        }}
      >
        Follow
      </Link>
    </Button>
  );

  const joinedShortLabel = formatJoinedDate(profile.createdAt, "short");
  const joinedLongLabel = formatJoinedDate(profile.createdAt, "long");

  const favoriteGenres = profile.favoriteGenres ?? [];

  let lastActiveLabel = "Loading...";
  if (userFilmsQuery.isError) {
    lastActiveLabel = "Unavailable";
  } else if (!userFilmsQuery.isPending) {
    const latestWatchedDate = getLatestWatchedDate(userFilmsQuery.data ?? []);
    lastActiveLabel = getRelativeTime(latestWatchedDate);
  }

  const diaryEntries = profile.stats?.entryCount ?? 0;
  const reviewCount = profile.stats?.reviewCount ?? 0;
  const filmCount = profile.stats?.filmCount ?? diaryEntries;
  const listCount = profile.stats?.listCount ?? 0;

  return (
    <div className="min-h-screen">
      <ProfileHero
        key={profile.username}
        profile={profile}
        joinedLabel={joinedShortLabel}
        headerAction={profileHeaderAction}
        actionError={
          isOwnProfile || followError?.username !== profile.username
            ? null
            : followError.message
        }
      />

      <div className="mx-auto w-full max-w-6xl px-4 pb-8">
        <ProfileStatsGrid
          diaryEntries={diaryEntries}
          reviews={reviewCount}
          filmsLogged={filmCount}
          lists={listCount}
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <ProfileTabs username={username} activeTab={activeTab} />
            {typeof children === "function" ? children(profile) : children}
          </div>

          <ProfileSidebar
            key={username}
            username={username}
            location={profile.location}
            joinedLabel={joinedLongLabel}
            lastActiveLabel={lastActiveLabel}
            favoriteGenres={favoriteGenres}
          />
        </div>
      </div>
    </div>
  );
};
