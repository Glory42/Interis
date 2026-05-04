import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMyTheme } from "@/features/theme/api";
import { applyAndPersistTheme } from "@/features/theme/theme-runtime";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { profileKeys } from "@/features/profile/hooks/useProfile";

export const useUpdateMyTheme = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (themeId: string) => updateMyTheme(themeId),
    onSuccess: async (themeId) => {
      applyAndPersistTheme(themeId);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: authKeys.me }),
        queryClient.invalidateQueries({ queryKey: profileKeys.me }),
      ]);
    },
  });
};
