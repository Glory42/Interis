import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMyProfile,
  getUserDiary,
  getUserProfile,
  updateMyProfile,
  updateMyUsername,
} from "@/features/profile/api";
import type { UpdateProfileInput, UpdateUsernameInput } from "@/types/api";

export const profileKeys = {
  all: ["profile"] as const,
  detail: (username: string) => ["profile", "detail", username] as const,
  diary: (username: string) => ["profile", "diary", username] as const,
  me: ["profile", "me"] as const,
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

export const useMyProfile = () =>
  useQuery({
    queryKey: profileKeys.me,
    queryFn: getMyProfile,
  });

export const useUpdateMyProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfileInput) => updateMyProfile(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileKeys.me }),
        queryClient.invalidateQueries({ queryKey: profileKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
      ]);
    },
  });
};

export const useUpdateMyUsername = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateUsernameInput) => updateMyUsername(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileKeys.me }),
        queryClient.invalidateQueries({ queryKey: profileKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
      ]);
    },
  });
};
