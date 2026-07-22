import {
  useUserRecentActivity,
  useUserTopPicks,
} from "@/features/profile/hooks/useProfile";
import { ProfileTopPicksRow } from "./ProfileTopPicksRow";
import { ProfileRecentActivitySection } from "./ProfileRecentActivitySection";
import { buildRecentActivityItems } from "./profileOverview.utils";

type ProfileOverviewContentProps = {
  username: string;
};

export const ProfileOverviewContent = ({ username }: ProfileOverviewContentProps) => {
  const recentActivityQuery = useUserRecentActivity(username, 20);
  const topPicksQuery = useUserTopPicks(username);

  if (recentActivityQuery.isError && topPicksQuery.isError) {
    return (
      <div className="border border-border/60 bg-card/30 p-4 text-sm text-destructive">
        Could not load profile overview.
      </div>
    );
  }

  const recentActivity = recentActivityQuery.data ?? [];
  const topPicks = topPicksQuery.data ?? null;
  const activities = buildRecentActivityItems({ feedItems: recentActivity, limit: 12 });

  const categoriesByKey = new Map(
    (topPicks?.categories ?? []).map((category) => [category.key, category]),
  );

  return (
    <div className="space-y-14">
      <section>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <ProfileTopPicksRow
            categoryKey="cinema"
            category={categoriesByKey.get("cinema")}
            isPending={topPicksQuery.isPending}
            isError={topPicksQuery.isError}
          />
          <ProfileTopPicksRow
            categoryKey="serial"
            category={categoriesByKey.get("serial")}
            isPending={topPicksQuery.isPending}
            isError={topPicksQuery.isError}
          />
        </div>
      </section>

      <ProfileRecentActivitySection
        activities={activities}
        isPending={recentActivityQuery.isPending}
        isError={recentActivityQuery.isError}
      />
    </div>
  );
};
