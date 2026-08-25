import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMyTheme } from "@/features/theme/api";
import { applyAndPersistTheme } from "@/features/theme/theme-runtime";
import { authKeys } from "@/features/auth/hooks/useAuth";

export const useUpdateMyTheme = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (themeId: string) => updateMyTheme(themeId),
    onSuccess: async (themeId) => {
      applyAndPersistTheme(themeId);
      await queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
  });
};
