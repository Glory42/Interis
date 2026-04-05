import { Sparkles } from "lucide-react";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";
import {
  useUserContributions,
  useUserDiary,
  useUserTop4Movies,
} from "@/features/profile/hooks/useProfile";
import { ProfileContributionHeatmapSection } from "./ProfileContributionHeatmapSection";
import { ProfileRecentActivitySection } from "./ProfileRecentActivitySection";
import { ProfileTopFilmsSection } from "./ProfileTopFilmsSection";
import {
  buildMovieRatingMap,
  buildRecentActivityItems,
} from "./profileOverview.utils";

type ProfileOverviewContentProps = {
  username: string;
};

export const ProfileOverviewContent = ({ username }: ProfileOverviewContentProps) => {
  const diaryQuery = useUserDiary(username);
  const topMoviesQuery = useUserTop4Movies(username);
  const contributionsQuery = useUserContributions(username, 365);

  if (diaryQuery.isPending || topMoviesQuery.isPending) {
    return (
      <div className=" border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
        Loading profile overview...
      </div>
    );
  }

  if (diaryQuery.isError || topMoviesQuery.isError) {
    return (
      <div className=" border border-border/60 bg-card/30 p-4 text-sm text-destructive">
        Could not load profile overview.
      </div>
    );
  }

  const diaryEntries = diaryQuery.data ?? [];
  const topMovies = topMoviesQuery.data ?? [];
  const contributionActiveDays = contributionsQuery.data?.totals.activeDays ?? 0;

  const ratingByTmdbId = buildMovieRatingMap(diaryEntries);
  const activities = buildRecentActivityItems(diaryEntries, 4);

  if (
    topMovies.length === 0 &&
    activities.length === 0 &&
    !contributionsQuery.isPending &&
    contributionActiveDays === 0
  ) {
    return (
      <ProfileTabEmptyState
        icon={Sparkles}
        title="No activity yet"
        description="This profile has not logged any diary entries or top films yet."
      />
    );
  }

  return (
    <div className="space-y-8">
      <ProfileTopFilmsSection movies={topMovies} ratingByTmdbId={ratingByTmdbId} />
      <ProfileContributionHeatmapSection
        calendar={contributionsQuery.data ?? null}
        isPending={contributionsQuery.isPending}
        isError={contributionsQuery.isError}
      />
      <ProfileRecentActivitySection activities={activities} />
    </div>
  );
};
