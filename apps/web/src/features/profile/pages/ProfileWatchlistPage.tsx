import { useState } from "react";
import { Bookmark } from "lucide-react";
import { ProfileMediaInteractionGridSection } from "@/features/profile/components/ProfileMediaInteractionGridSection";
import {
  toMediaShelfType,
  type MediaShelfFilter,
} from "@/features/profile/components/media-shelf-filter";
import { useUserWatchlist } from "@/features/profile/hooks/useProfile";

type ProfileWatchlistPageProps = {
  username: string;
};

export const ProfileWatchlistPage = ({
  username,
}: ProfileWatchlistPageProps) => {
  const [filter, setFilter] = useState<MediaShelfFilter>("all");
  const watchlistQuery = useUserWatchlist(username, toMediaShelfType(filter));

  return (
    <ProfileMediaInteractionGridSection
      errorLabel="Could not load watchlist."
      sectionTitle="Watchlist"
      interactionVerb="added"
      emptyState={{
        icon: Bookmark,
        title: "No watchlist items yet",
        description: "This profile has not added anything to watchlist yet.",
        cta: { label: "Browse Movie", to: "/movies" },
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
