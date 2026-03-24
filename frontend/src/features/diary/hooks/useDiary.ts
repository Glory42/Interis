import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createDiaryEntry, getMyDiary } from "@/features/diary/api";
import { movieKeys } from "@/features/films/hooks/useMovies";
import type { CreateDiaryEntryInput } from "@/types/api";

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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: diaryKeys.me }),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: movieKeys.logs(variables.tmdbId) }),
      ]);
    },
  });
};
