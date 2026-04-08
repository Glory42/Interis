import {
  useUserRecentActivity,
  useUserTopPicks,
} from "@/features/profile/hooks/useProfile";
import { ProfileFavoritesPreviewSection } from "./ProfileFavoritesPreviewSection";
import { ProfileRecentActivitySection } from "./ProfileRecentActivitySection";
import {
  buildRecentActivityItems,
} from "./profileOverview.utils";

type ProfileOverviewContentProps = {
  username: string;
};

export const ProfileOverviewContent = ({ username }: ProfileOverviewContentProps) => {
  const recentActivityQuery = useUserRecentActivity(username, 20);
  const topPicksQuery = useUserTopPicks(username);

  if (recentActivityQuery.isError && topPicksQuery.isError) {
    return (
      <div className=" border border-border/60 bg-card/30 p-4 text-sm text-destructive">
        Could not load profile overview.
      </div>
    );
  }

  const recentActivity = recentActivityQuery.data ?? [];
  const topPicks = topPicksQuery.data ?? null;

  const activities = buildRecentActivityItems({
    feedItems: recentActivity,
    limit: 8,
  });

  return (
    <div className="space-y-10">
      <ProfileFavoritesPreviewSection
        topPicks={topPicks}
        isTopPicksPending={topPicksQuery.isPending}
        isTopPicksError={topPicksQuery.isError}
      />
      <ProfileRecentActivitySection
        activities={activities}
        isPending={recentActivityQuery.isPending}
        isError={recentActivityQuery.isError}
      />
    </div>
  );
};
