import { useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Bell, Search } from "lucide-react-native";
import { useTheme } from "@/theme";
import type { FeedFilter, FeedItem } from "@/types/feed";
import { useAuth } from "@/hooks/useAuth";
import { useFollowingFeed, useTrendingMovies, useTrendingSeries } from "@/hooks/useFeed";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";
import { useToggleReviewLike } from "@/hooks/useReviews";
import {
  AppText,
  BrandMark,
  Button,
  EmptyView,
  ErrorView,
  IconButton,
  LoadingView,
  Screen,
  SegmentedTabs,
  Surface,
  TabHeader,
} from "@/components/ui";
import { PosterRail, type PosterRailItem } from "@/components/media/PosterRail";
import { FeedActivityCard } from "@/components/feed/FeedActivityCard";

const TrendingRails = () => {
  const { colors } = useTheme();
  const moviesQuery = useTrendingMovies();
  const seriesQuery = useTrendingSeries();

  const movies = useMemo<PosterRailItem[]>(
    () =>
      (moviesQuery.data ?? []).slice(0, 12).map((movie) => ({
        tmdbId: movie.tmdbId,
        title: movie.title,
        posterPath: movie.posterPath,
        year: movie.releaseYear ?? null,
        mediaType: "movie",
      })),
    [moviesQuery.data],
  );
  const series = useMemo<PosterRailItem[]>(
    () =>
      (seriesQuery.data ?? []).slice(0, 12).map((serial) => ({
        tmdbId: serial.tmdbId,
        title: serial.title,
        posterPath: serial.posterPath,
        year: serial.firstAirYear ?? null,
        mediaType: "tv",
      })),
    [seriesQuery.data],
  );

  return (
    <View style={{ gap: 22 }}>
      <PosterRail label="Trending movies" color={colors.movie} items={movies} isLoading={moviesQuery.isPending} />
      <PosterRail label="Trending series" color={colors.serial} items={series} isLoading={seriesQuery.isPending} />
    </View>
  );
};

const GuestWelcome = () => {
  const router = useRouter();

  return (
    <View style={{ padding: 16 }}>
      <Surface padding={22}>
        <AppText variant="kicker" size={10} tone="primary">
          Social movie journal
        </AppText>
        <AppText variant="display" size={28} style={{ marginTop: 8 }}>
          Track what you watch. Share what you think.
        </AppText>
        <AppText tone="muted" size={14} style={{ marginTop: 10 }}>
          Log films and series, rate them with rockets, write reviews and follow friends.
        </AppText>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
          <Button label="Create account" onPress={() => router.push("/register")} style={{ flex: 1 }} />
          <Button label="Sign in" variant="outline" onPress={() => router.push("/login")} style={{ flex: 1 }} />
        </View>
      </Surface>
    </View>
  );
};

const FILTER_TABS = (colors: { primary: string; movie: string; serial: string }) => [
  { id: "all" as const, label: "All", color: colors.primary },
  { id: "movie" as const, label: "Movie", color: colors.movie },
  { id: "serial" as const, label: "Serial", color: colors.serial },
];

export const HomeScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, isUserLoading, isAuthenticated } = useAuth();
  const [filter, setFilter] = useState<FeedFilter>("all");
  const feedQuery = useFollowingFeed(filter, isAuthenticated);
  const unreadQuery = useUnreadNotificationCount(isAuthenticated);
  const { mutate: toggleReviewLike } = useToggleReviewLike();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const items = useMemo(() => feedQuery.data?.pages.flatMap((page) => page.items) ?? [], [feedQuery.data]);

  const handleToggleLike = useCallback(
    (reviewId: string, liked: boolean) => toggleReviewLike({ reviewId, liked }),
    [toggleReviewLike],
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([feedQuery.refetch(), unreadQuery.refetch()]).finally(() => setIsRefreshing(false));
  };

  const header = (
    <TabHeader
      title="Interis"
      leading={<BrandMark size={30} />}
      trailing={
        <View style={{ flexDirection: "row" }}>
          <IconButton
            accessibilityLabel="Search"
            onPress={() => router.push("/search")}
            icon={<Search size={20} color={colors.mutedForeground} />}
          />
          {user ? (
            <IconButton
              accessibilityLabel="Notifications"
              badge={unreadQuery.data ?? 0}
              onPress={() => router.push("/notifications")}
              icon={<Bell size={20} color={colors.mutedForeground} />}
            />
          ) : undefined}
        </View>
      }
    />
  );

  if (isUserLoading) {
    return (
      <Screen withTopInset>
        {header}
        <LoadingView />
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen withTopInset>
        {header}
        <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 32 }}>
          <GuestWelcome />
          <TrendingRails />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen withTopInset>
      {header}
      <FlatList
        data={items}
        keyExtractor={(item: FeedItem) => item.id}
        contentContainerStyle={{ paddingBottom: 32 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <FeedActivityCard item={item} onToggleReviewLike={handleToggleLike} />
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
            void feedQuery.fetchNextPage();
          }
        }}
        ListHeaderComponent={
          <View style={{ gap: 20, paddingTop: 18, paddingBottom: 14 }}>
            <TrendingRails />
            <View style={{ paddingHorizontal: 16 }}>
              <SegmentedTabs tabs={FILTER_TABS(colors)} activeId={filter} onChange={setFilter} />
            </View>
          </View>
        }
        ListEmptyComponent={
          feedQuery.isPending ? (
            <LoadingView />
          ) : feedQuery.isError ? (
            <ErrorView message="Could not load your feed." onRetry={() => void feedQuery.refetch()} />
          ) : (
            <EmptyView
              title="Your feed is quiet"
              message="Follow people to see their logs, reviews and lists here."
              action={{ label: "Find people", onPress: () => router.push("/search") }}
            />
          )
        }
        ListFooterComponent={feedQuery.isFetchingNextPage ? <LoadingView style={{ paddingVertical: 20 }} /> : undefined}
      />
    </Screen>
  );
};
