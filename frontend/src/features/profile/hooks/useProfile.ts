import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getMyProfile,
  getUserDiary,
  getUserFilms,
  getUserProfile,
  getUserReviews,
  getUserTop4Movies,
  updateMyProfile,
} from "@/features/profile/api";
import { authKeys } from "@/features/auth/hooks/useAuth";
import type { MeProfile, UpdateProfileInput } from "@/types/api";

export const profileKeys = {
  all: ["profile"] as const,
  detail: (username: string) => ["profile", "detail", username] as const,
  diary: (username: string) => ["profile", "diary", username] as const,
  films: (username: string) => ["profile", "films", username] as const,
  reviews: (username: string) => ["profile", "reviews", username] as const,
  top4: (username: string) => ["profile", "top4", username] as const,
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
      queryClient.invalidateQueries({ queryKey: profileKeys.reviews(me.username) }),
      queryClient.invalidateQueries({ queryKey: profileKeys.top4(me.username) }),
    );
  }

  await Promise.all(tasks);
};

export const useUserProfile = (username: string) =>
  useQuery({
    queryKey: profileKeys.detail(username),
    queryFn: () => getUserProfile(username),
    enabled: username.trim().length > 0,
  });

export const useUserDiary = (username: string) =>
  useQuery({
    queryKey: profileKeys.diary(username),
    queryFn: () => getUserDiary(username),
    enabled: username.trim().length > 0,
  });

export const useUserFilms = (username: string) =>
  useQuery({
    queryKey: profileKeys.films(username),
    queryFn: () => getUserFilms(username),
    enabled: username.trim().length > 0,
  });

export const useUserReviews = (username: string) =>
  useQuery({
    queryKey: profileKeys.reviews(username),
    queryFn: () => getUserReviews(username),
    enabled: username.trim().length > 0,
  });

export const useUserTop4Movies = (username: string) =>
  useQuery({
    queryKey: profileKeys.top4(username),
    queryFn: () => getUserTop4Movies(username),
    enabled: username.trim().length > 0,
    staleTime: 300_000,
  });

export const useMyProfile = () =>
  useQuery({
    queryKey: profileKeys.me,
    queryFn: getMyProfile,
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
