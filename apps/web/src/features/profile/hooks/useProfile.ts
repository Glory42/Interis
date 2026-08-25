import {
  QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getUserLikedFilms,
  getUserLikedReviews,
  getUserLikedLists,
  getUserProfile,
  getUserReviews,
  getUserWatchlist,
  getUserCurrentlyWatching,
  getUserDiary,
  searchUsers,
  getUserRecentActivity,
  getUserTopPicks,
  updateMyProfile,
} from "@/features/profile/api";
import { authKeys } from "@/features/auth/hooks/useAuth";
import type { MeProfile, UpdateProfileInput } from "@/types/api";

export const profileKeys = {
  all: ["profile"] as const,
  search: (query: string, limit: number) =>
    ["profile", "search", query, limit] as const,
  detail: (username: string) => ["profile", "detail", username] as const,
  likes: (username: string) => ["profile", "likes", username] as const,
  likedReviews: (username: string) => ["profile", "liked-reviews", username] as const,
  likedLists: (username: string) => ["profile", "liked-lists", username] as const,
  watchlist: (username: string) => ["profile", "watchlist", username] as const,
  currentlyWatching: (username: string) =>
    ["profile", "currently-watching", username] as const,
  diary: (username: string) => ["profile", "diary", username] as const,
  reviews: (username: string) => ["profile", "reviews", username] as const,
  topPicks: (username: string) => ["profile", "top-picks", username] as const,
  recentActivity: (username: string, limit: number) =>
    ["profile", "recent-activity", username, limit] as const,
};

const invalidateCurrentUserProfile = async (
  queryClient: QueryClient,
) => {
  const me = queryClient.getQueryData<MeProfile | null>(authKeys.me);
  const tasks = [
    queryClient.invalidateQueries({ queryKey: authKeys.me }),
  ];

  if (me?.username) {
    tasks.push(
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(me.username) }),
      queryClient.invalidateQueries({ queryKey: profileKeys.likes(me.username) }),
      queryClient.invalidateQueries({ queryKey: profileKeys.watchlist(me.username) }),
      queryClient.invalidateQueries({ queryKey: profileKeys.reviews(me.username) }),
      queryClient.invalidateQueries({ queryKey: profileKeys.topPicks(me.username) }),
    );
  }

  await Promise.all(tasks);
};

export const useUserProfile = (username: string) =>
  useQuery({
    queryKey: profileKeys.detail(username),
    queryFn: ({ signal }) => getUserProfile(username, { signal }),
    enabled: username.trim().length > 0,
  });

export const useUserSearch = (query: string, limit = 8) =>
  useQuery({
    queryKey: profileKeys.search(query, limit),
    queryFn: ({ signal }) => searchUsers(query, { limit }, { signal }),
    enabled: query.trim().length > 0,
  });

// Bounds the underlying request to PROFILE_LIST_PAGE_SIZE items per page
// instead of fetching a profile's entire collection unbounded - a "load
// more" click (or none, for small profiles) fetches the next page.
export const PROFILE_LIST_PAGE_SIZE = 60;

const getNextProfileListPageParam = <T>(lastPage: T[], allPages: T[][]): number | undefined =>
  lastPage.length === PROFILE_LIST_PAGE_SIZE ? allPages.length * PROFILE_LIST_PAGE_SIZE : undefined;

export const useUserLikedFilms = (username: string) =>
  useInfiniteQuery({
    queryKey: profileKeys.likes(username),
    queryFn: ({ signal, pageParam }) =>
      getUserLikedFilms(username, PROFILE_LIST_PAGE_SIZE, pageParam, { signal }),
    initialPageParam: 0,
    getNextPageParam: getNextProfileListPageParam,
    enabled: username.trim().length > 0,
  });

export const useUserWatchlist = (username: string) =>
  useInfiniteQuery({
    queryKey: profileKeys.watchlist(username),
    queryFn: ({ signal, pageParam }) =>
      getUserWatchlist(username, PROFILE_LIST_PAGE_SIZE, pageParam, { signal }),
    initialPageParam: 0,
    getNextPageParam: getNextProfileListPageParam,
    enabled: username.trim().length > 0,
  });

export const useUserCurrentlyWatching = (username: string, limit = 20) =>
  useQuery({
    queryKey: profileKeys.currentlyWatching(username),
    queryFn: ({ signal }) => getUserCurrentlyWatching(username, limit, { signal }),
    enabled: username.trim().length > 0,
  });

export const useUserDiary = (username: string) =>
  useInfiniteQuery({
    queryKey: profileKeys.diary(username),
    queryFn: ({ signal, pageParam }) =>
      getUserDiary(username, PROFILE_LIST_PAGE_SIZE, pageParam, { signal }),
    initialPageParam: 0,
    getNextPageParam: getNextProfileListPageParam,
    enabled: username.trim().length > 0,
  });

export const useUserReviews = (username: string) =>
  useInfiniteQuery({
    queryKey: profileKeys.reviews(username),
    queryFn: ({ signal, pageParam }) =>
      getUserReviews(username, PROFILE_LIST_PAGE_SIZE, pageParam, { signal }),
    initialPageParam: 0,
    getNextPageParam: getNextProfileListPageParam,
    enabled: username.trim().length > 0,
  });

export const useUserTopPicks = (username: string) =>
  useQuery({
    queryKey: profileKeys.topPicks(username),
    queryFn: ({ signal }) => getUserTopPicks(username, { signal }),
    enabled: username.trim().length > 0,
  });

export const useUserRecentActivity = (username: string, limit = 20) =>
  useQuery({
    queryKey: profileKeys.recentActivity(username, limit),
    queryFn: ({ signal }) => getUserRecentActivity(username, limit, { signal }),
    enabled: username.trim().length > 0,
  });

export const useUserLikedReviews = (username: string) =>
  useInfiniteQuery({
    queryKey: profileKeys.likedReviews(username),
    queryFn: ({ signal, pageParam }) =>
      getUserLikedReviews(username, PROFILE_LIST_PAGE_SIZE, pageParam, { signal }),
    initialPageParam: 0,
    getNextPageParam: getNextProfileListPageParam,
    enabled: username.trim().length > 0,
  });

export const useUserLikedLists = (username: string) =>
  useInfiniteQuery({
    queryKey: profileKeys.likedLists(username),
    queryFn: ({ signal, pageParam }) =>
      getUserLikedLists(username, PROFILE_LIST_PAGE_SIZE, pageParam, { signal }),
    initialPageParam: 0,
    getNextPageParam: getNextProfileListPageParam,
    enabled: username.trim().length > 0,
  });

export const useUpdateMyProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfileInput) => updateMyProfile(payload),
    onSuccess: () => {
      void invalidateCurrentUserProfile(queryClient).catch(() => undefined);
    },
  });
};
