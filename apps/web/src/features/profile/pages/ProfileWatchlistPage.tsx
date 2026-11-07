import { useState } from "react";
import { ProfileMediaInteractionGridSection } from "@/features/profile/components/ProfileMediaInteractionGridSection";
import {
  toMediaShelfType,
  type MediaShelfFilter,
} from "@/features/profile/components/media-shelf-filter";
import { useIsOwnProfile, useUserWatchlist } from "@/features/profile/hooks/useProfile";

type ProfileWatchlistPageProps = {
  username: string;
};

export const ProfileWatchlistPage = ({
  username,
}: ProfileWatchlistPageProps) => {
  const [filter, setFilter] = useState<MediaShelfFilter>("all");
  const watchlistQuery = useUserWatchlist(username, toMediaShelfType(filter));
  const isOwner = useIsOwnProfile(username);

  return (
    <ProfileMediaInteractionGridSection
      errorLabel="Could not load watchlist."
      sectionTitle="Watchlist"
      interactionVerb="added"
      isOwner={isOwner}
      emptyState={{
        visitorText: "Nothing on the watchlist.",
        ownerText: "Add titles from any film or series page.",
        ownerAction: { label: "Browse films →", to: "/movies" },
      }}
      isPending={watchlistQuery.isPending}
      isError={watchlistQuery.isError}
      items={watchlistQuery.data?.items ?? []}
      counts={watchlistQuery.data?.counts ?? { movie: 0, tv: 0 }}
      activeFilter={filter}
      onFilterChange={setFilter}
      hasMore={Boolean(watchlistQuery.hasNextPage)}
      isLoadingMore={watchlistQuery.isFetchingNextPage}
      onLoadMore={() => { void watchlistQuery.fetchNextPage(); }}
    />
  );
};
