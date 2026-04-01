import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { createDiaryEntry, getMyDiary } from "@/features/diary/api";
import { movieKeys } from "@/features/films/hooks/useMovies";
import { profileKeys } from "@/features/profile/hooks/useProfile";
import type { CreateDiaryEntryInput, MeProfile } from "@/types/api";

export const diaryKeys = {
  all: ["diary"] as const,
  me: ["diary", "me"] as const,
};

export const useMyDiary = () =>
  useQuery({
    queryKey: diaryKeys.me,
    queryFn: getMyDiary,
  });

export const useCreateDiaryEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDiaryEntryInput) => createDiaryEntry(input),
    onSuccess: async (_data, variables) => {
      const me = queryClient.getQueryData<MeProfile | null>(authKeys.me);
      const tasks = [
        queryClient.invalidateQueries({ queryKey: diaryKeys.me }),
        queryClient.invalidateQueries({ queryKey: movieKeys.logs(variables.tmdbId) }),
        queryClient.invalidateQueries({
          queryKey: ["movies", "detail-view", variables.tmdbId],
        }),
      ];

      if (me?.username) {
        tasks.push(
          queryClient.invalidateQueries({ queryKey: profileKeys.detail(me.username) }),
          queryClient.invalidateQueries({ queryKey: profileKeys.diary(me.username) }),
        );
      }

      await Promise.all(tasks);
    },
  });
};
