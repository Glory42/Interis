import { useAuth } from "@/features/auth/hooks/useAuth";
import { useUserRecentActivity, useUserTopPicks } from "@/features/profile/hooks/useProfile";
import { ProfileTopPicksRow } from "./ProfileTopPicksRow";
import { ProfileOverviewActivity } from "./ProfileOverviewActivity";

type ProfileOverviewContentProps = {
  username: string;
};

export const ProfileOverviewContent = ({ username }: ProfileOverviewContentProps) => {
  const { user } = useAuth();
  const isOwner = user?.username.toLowerCase() === username.toLowerCase();
  const recentActivityQuery = useUserRecentActivity(username);
  const topPicksQuery = useUserTopPicks(username);

  if (recentActivityQuery.isError && topPicksQuery.isError) {
    return <p className="body-s text-[color:var(--danger)]">Could not load profile overview.</p>;
  }

  const categoriesByKey = new Map((topPicksQuery.data?.categories ?? []).map((category) => [category.key, category]));

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {(["movie", "serial"] as const).map((key) => (
          <ProfileTopPicksRow
            key={key}
            categoryKey={key}
            category={categoriesByKey.get(key)}
            isPending={topPicksQuery.isPending}
            isError={topPicksQuery.isError}
            isOwner={isOwner}
          />
        ))}
      </section>

      <ProfileOverviewActivity
        rows={recentActivityQuery.data ?? []}
        isPending={recentActivityQuery.isPending}
        isError={recentActivityQuery.isError}
      />
    </div>
  );
};
