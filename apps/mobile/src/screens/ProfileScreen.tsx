import { useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, View, useWindowDimensions } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/theme";
import type { FeedItem } from "@/types/feed";
import type { DiaryItem, UserInteractionMedia, UserReview } from "@/types/profile";
import { useAuth } from "@/hooks/useAuth";
import {
  profileKeys,
  useUserCurrentlyWatching,
  useUserList,
  useUserProfile,
  useUserRecentActivity,
  useUserTopPicks,
} from "@/hooks/useProfile";
import { useIsFollowing, useToggleFollow } from "@/hooks/useSocial";
import { useToggleReviewLike } from "@/hooks/useReviews";
import { EmptyView, ErrorView, LoadingView, SegmentedTabs } from "@/components/ui";
import { FeedActivityCard } from "@/components/feed/FeedActivityCard";
import { PosterTile } from "@/components/media/PosterTile";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { TopPicksSection } from "@/components/profile/TopPicksSection";
import { CurrentlyWatchingRail } from "@/components/profile/CurrentlyWatchingRail";
import { DiaryRow } from "@/components/profile/DiaryRow";
import { UserReviewRow } from "@/components/profile/UserReviewRow";

type ProfileTab = "activity" | "diary" | "reviews" | "likes" | "watchlist";

type Row =
  | { type: "activity"; key: string; item: FeedItem }
  | { type: "diary"; key: string; item: DiaryItem }
  | { type: "review"; key: string; item: UserReview }
  | { type: "grid"; key: string; items: UserInteractionMedia[] };

const GRID_COLUMNS = 3;

const chunk = <T,>(items: T[], size: number): T[][] => {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
};

export const ProfileScreen = ({ username }: { username: string }) => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [tab, setTab] = useState<ProfileTab>("activity");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isOwnProfile = user?.username === username;
  const profileQuery = useUserProfile(username);
  const topPicksQuery = useUserTopPicks(username);
  const watchingQuery = useUserCurrentlyWatching(username);
  const recentQuery = useUserRecentActivity(username, tab === "activity");
  const diaryQuery = useUserList(username, "diary", tab === "diary");
  const reviewsQuery = useUserList(username, "reviews", tab === "reviews");
  const likesQuery = useUserList(username, "likes", tab === "likes");
  const watchlistQuery = useUserList(username, "watchlist", tab === "watchlist");
  const isFollowingQuery = useIsFollowing(username, Boolean(user) && !isOwnProfile);
  const toggleFollow = useToggleFollow(username, user?.username ?? null);
  const { mutate: toggleReviewLike } = useToggleReviewLike(profileKeys.recent(username));

  const handleToggleLike = useCallback(
    (reviewId: string, liked: boolean) => toggleReviewLike({ reviewId, liked }),
    [toggleReviewLike],
  );

  const activeListQuery =
    tab === "diary"
      ? diaryQuery
      : tab === "reviews"
        ? reviewsQuery
        : tab === "likes"
          ? likesQuery
          : tab === "watchlist"
            ? watchlistQuery
            : null;

  const rows = useMemo<Row[]>(() => {
    switch (tab) {
      case "activity":
        return (recentQuery.data ?? []).map((item) => ({ type: "activity", key: item.id, item }));
      case "diary":
        return (diaryQuery.data?.pages.flat() ?? []).map((item) => ({ type: "diary", key: item.id, item }));
      case "reviews":
        return (reviewsQuery.data?.pages.flat() ?? []).map((item) => ({ type: "review", key: item.id, item }));
      case "likes":
      case "watchlist": {
        const source = tab === "likes" ? likesQuery.data : watchlistQuery.data;
        return chunk(source?.pages.flat() ?? [], GRID_COLUMNS).map((items, index) => ({
          type: "grid",
          key: `${tab}-${index}`,
          items,
        }));
      }
    }
  }, [tab, recentQuery.data, diaryQuery.data, reviewsQuery.data, likesQuery.data, watchlistQuery.data]);

  const tileWidth = Math.floor((width - 32 - 12 * (GRID_COLUMNS - 1)) / GRID_COLUMNS);
  const activeQuery = tab === "activity" ? recentQuery : activeListQuery;

  if (profileQuery.isPending) {
    return <LoadingView style={{ paddingTop: 80 }} />;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return <ErrorView message="Could not load this profile." onRetry={() => void profileQuery.refetch()} />;
  }

  const profile = profileQuery.data;

  const header = (
    <View style={{ gap: 22, paddingBottom: 8 }}>
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        canFollow={Boolean(user)}
        isFollowing={isFollowingQuery.data ?? false}
        isFollowPending={toggleFollow.isPending || isFollowingQuery.isPending}
        onToggleFollow={() => toggleFollow.mutate(!(isFollowingQuery.data ?? false))}
      />
      {topPicksQuery.data ? <TopPicksSection topPicks={topPicksQuery.data} /> : undefined}
      <CurrentlyWatchingRail items={watchingQuery.data ?? []} />
      <View style={{ paddingHorizontal: 16 }}>
        <SegmentedTabs<ProfileTab>
          scrollable
          activeId={tab}
          onChange={setTab}
          tabs={[
            { id: "activity", label: "Activity" },
            { id: "diary", label: "Diary" },
            { id: "reviews", label: "Reviews" },
            { id: "likes", label: "Likes", color: colors.destructive },
            { id: "watchlist", label: "Watchlist", color: colors.accent },
          ]}
        />
      </View>
    </View>
  );

  return (
    <FlatList
      data={rows}
      keyExtractor={(row) => row.key}
      ListHeaderComponent={header}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          tintColor={colors.primary}
          onRefresh={async () => {
            setIsRefreshing(true);
            await queryClient
              .invalidateQueries({ queryKey: profileKeys.user(username) })
              .finally(() => setIsRefreshing(false));
          }}
        />
      }
      renderItem={({ item: row }) => {
        switch (row.type) {
          case "activity":
            return (
              <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
                <FeedActivityCard item={row.item} onToggleReviewLike={handleToggleLike} />
              </View>
            );
          case "diary":
            return <DiaryRow item={row.item} />;
          case "review":
            return (
              <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
                <UserReviewRow review={row.item} username={username} />
              </View>
            );
          case "grid":
            return (
              <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingTop: 16 }}>
                {row.items.map((media) => (
                  <PosterTile
                    key={`${media.mediaType}-${media.tmdbId}`}
                    mediaType={media.mediaType}
                    tmdbId={media.tmdbId}
                    title={media.title}
                    posterPath={media.posterPath}
                    year={media.releaseYear}
                    width={tileWidth}
                  />
                ))}
              </View>
            );
        }
      }}
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (activeListQuery?.hasNextPage && !activeListQuery.isFetchingNextPage) {
          void activeListQuery.fetchNextPage();
        }
      }}
      ListEmptyComponent={
        activeQuery?.isPending ? (
          <LoadingView />
        ) : activeQuery?.isError ? (
          <ErrorView onRetry={() => void activeQuery.refetch()} />
        ) : (
          <EmptyView
            title="Nothing here yet"
            message={isOwnProfile ? "Start logging what you watch." : `@${username} hasn't added anything here.`}
          />
        )
      }
      ListFooterComponent={activeListQuery?.isFetchingNextPage ? <LoadingView style={{ paddingVertical: 16 }} /> : undefined}
    />
  );
};
