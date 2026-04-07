import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getUserLikedFilms,
  getMyProfile,
  getUserDiary,
  getUserFilms,
  getUserProfile,
  getUserReviews,
  getUserWatchlist,
  searchUsers,
  getUserTop4Movies,
  getUserContributions,
  updateMyProfile,
} from "@/features/profile/api";
import { authKeys } from "@/features/auth/hooks/useAuth";
import type { MeProfile, UpdateProfileInput } from "@/types/api";

export const profileKeys = {
  all: ["profile"] as const,
  search: (query: string, limit: number) =>
    ["profile", "search", query, limit] as const,
  detail: (username: string) => ["profile", "detail", username] as const,
  diary: (username: string) => ["profile", "diary", username] as const,
  films: (username: string) => ["profile", "films", username] as const,
  likes: (username: string) => ["profile", "likes", username] as const,
  watchlist: (username: string) => ["profile", "watchlist", username] as const,
  reviews: (username: string) => ["profile", "reviews", username] as const,
  top4: (username: string) => ["profile", "top4", username] as const,
  contributions: (username: string, range: number | "year") =>
    ["profile", "contributions", username, range] as const,
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
      queryClient.invalidateQueries({ queryKey: profileKeys.diary(me.username) }),
      queryClient.invalidateQueries({ queryKey: profileKeys.films(me.username) }),
      queryClient.invalidateQueries({ queryKey: profileKeys.likes(me.username) }),
      queryClient.invalidateQueries({ queryKey: profileKeys.watchlist(me.username) }),
      queryClient.invalidateQueries({ queryKey: profileKeys.reviews(me.username) }),
      queryClient.invalidateQueries({ queryKey: profileKeys.top4(me.username) }),
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

export const useUserDiary = (username: string) =>
  useQuery({
    queryKey: profileKeys.diary(username),
    queryFn: ({ signal }) => getUserDiary(username, { signal }),
    enabled: username.trim().length > 0,
  });

export const useUserFilms = (username: string) =>
  useQuery({
    queryKey: profileKeys.films(username),
    queryFn: ({ signal }) => getUserFilms(username, { signal }),
    enabled: username.trim().length > 0,
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

export const useUserTop4Movies = (username: string) =>
  useQuery({
    queryKey: profileKeys.top4(username),
    queryFn: ({ signal }) => getUserTop4Movies(username, { signal }),
    enabled: username.trim().length > 0,
  });

export const useUserContributions = (username: string, days?: number) => {
  const rangeKey = typeof days === "number" ? days : "year";

  return useQuery({
    queryKey: profileKeys.contributions(username, rangeKey),
    queryFn: ({ signal }) => getUserContributions(username, days, { signal }),
    enabled: username.trim().length > 0,
  });
};

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
