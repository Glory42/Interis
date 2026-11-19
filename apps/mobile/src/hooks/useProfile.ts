import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  getUserCurrentlyWatching,
  getUserDiary,
  getUserLikes,
  getUserProfile,
  getUserRecentActivity,
  getUserReviews,
  getUserTopPicks,
  getUserWatchlist,
} from "@/api/profile";

export type ProfileListTab = "diary" | "reviews" | "likes" | "watchlist";

export const profileKeys = {
  all: ["profile"] as const,
  user: (username: string) => ["profile", username] as const,
  detail: (username: string) => ["profile", username, "detail"] as const,
  topPicks: (username: string) => ["profile", username, "top-picks"] as const,
  recent: (username: string) => ["profile", username, "recent"] as const,
  watching: (username: string) => ["profile", username, "watching"] as const,
  list: (username: string, tab: ProfileListTab) => ["profile", username, "list", tab] as const,
};

export const useUserProfile = (username: string) =>
  useQuery({
    queryKey: profileKeys.detail(username),
    queryFn: ({ signal }) => getUserProfile(username, { signal }),
    enabled: username.length > 0,
  });

export const useUserTopPicks = (username: string) =>
  useQuery({
    queryKey: profileKeys.topPicks(username),
    queryFn: ({ signal }) => getUserTopPicks(username, { signal }),
    enabled: username.length > 0,
  });

export const useUserRecentActivity = (username: string, enabled: boolean) =>
  useQuery({
    queryKey: profileKeys.recent(username),
    queryFn: ({ signal }) => getUserRecentActivity(username, { signal }),
    enabled: enabled && username.length > 0,
  });

export const useUserCurrentlyWatching = (username: string) =>
  useQuery({
    queryKey: profileKeys.watching(username),
    queryFn: ({ signal }) => getUserCurrentlyWatching(username, { signal }),
    enabled: username.length > 0,
  });

const PAGE_SIZE = 24;

const fetchers = {
  diary: getUserDiary,
  reviews: getUserReviews,
  likes: getUserLikes,
  watchlist: getUserWatchlist,
} as const;

type ListItem<T extends ProfileListTab> = Awaited<ReturnType<(typeof fetchers)[T]>>[number];

// Offset-paginated profile collections (bounded per CLAUDE.md: never fetch a
// whole user-generated list at once).
export const useUserList = <T extends ProfileListTab>(username: string, tab: T, enabled: boolean) =>
  useInfiniteQuery({
    queryKey: profileKeys.list(username, tab),
    queryFn: async ({ pageParam, signal }) =>
      (await fetchers[tab](username, PAGE_SIZE, pageParam, { signal })) as ListItem<T>[],
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length * PAGE_SIZE,
    enabled: enabled && username.length > 0,
  });
