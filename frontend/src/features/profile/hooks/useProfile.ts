import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getUserLikedFilms,
  getUserLikedReviews,
  getUserLikedLists,
  getMyProfile,
  getUserProfile,
  getUserReviews,
  getUserWatchlist,
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
  reviews: (username: string) => ["profile", "reviews", username] as const,
  topPicks: (username: string) => ["profile", "top-picks", username] as const,
  recentActivity: (username: string, limit: number) =>
    ["profile", "recent-activity", username, limit] as const,
  me: ["profile", "me"] as const,
};

const invalidateCurrentUserProfile = async (
  queryClient: QueryClient,
) => {
  const me = queryClient.getQueryData<MeProfile | null>(authKeys.me);
  const tasks = [
    queryClient.invalidateQueries({ queryKey: profileKeys.me }),
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

export const useUserLikedFilms = (username: string) =>
  useQuery({
    queryKey: profileKeys.likes(username),
    queryFn: ({ signal }) => getUserLikedFilms(username, { signal }),
    enabled: username.trim().length > 0,
  });

export const useUserWatchlist = (username: string) =>
  useQuery({
    queryKey: profileKeys.watchlist(username),
    queryFn: ({ signal }) => getUserWatchlist(username, { signal }),
    enabled: username.trim().length > 0,
  });

export const useUserReviews = (username: string) =>
  useQuery({
    queryKey: profileKeys.reviews(username),
    queryFn: ({ signal }) => getUserReviews(username, { signal }),
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
  useQuery({
    queryKey: profileKeys.likedReviews(username),
    queryFn: ({ signal }) => getUserLikedReviews(username, { signal }),
    enabled: username.trim().length > 0,
  });

export const useUserLikedLists = (username: string) =>
  useQuery({
    queryKey: profileKeys.likedLists(username),
    queryFn: ({ signal }) => getUserLikedLists(username, { signal }),
    enabled: username.trim().length > 0,
  });

export const useMyProfile = () =>
  useQuery({
    queryKey: profileKeys.me,
    queryFn: ({ signal }) => getMyProfile({ signal }),
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
