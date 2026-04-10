import { Bookmark } from "lucide-react";
import { ProfileMediaInteractionGridSection } from "@/features/profile/components/ProfileMediaInteractionGridSection";
import { useUserWatchlist } from "@/features/profile/hooks/useProfile";

type ProfileWatchlistPageProps = {
  username: string;
};

export const ProfileWatchlistPage = ({
  username,
}: ProfileWatchlistPageProps) => {
  const watchlistQuery = useUserWatchlist(username);
  const items = watchlistQuery.data ?? [];

  return (
    <ProfileMediaInteractionGridSection
      loadingLabel="Loading watchlist..."
      errorLabel="Could not load watchlist."
      sectionTitle="Watchlist"
      interactionVerb="added"
      emptyState={{
        icon: Bookmark,
        title: "No watchlist items yet",
        description: "This profile has not added anything to watchlist yet.",
      }}
      isPending={watchlistQuery.isPending}
      isError={watchlistQuery.isError}
      items={items}
    />
  );
};
