import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/features/auth/hooks/useAuth";
import {
  completeOnboarding,
  getOnboardingTitles,
  saveTaste,
  type TasteItem,
} from "@/features/onboarding/api";
import { viewerStatusKeys } from "@/features/viewer-status/hooks/useViewerStatuses";
import { socialKeys } from "@/features/social/hooks/useSocial";
import type { MeProfile } from "@/types/api";

export const onboardingKeys = {
  titles: ["onboarding", "titles"] as const,
};

export const useOnboardingTitles = () =>
  useQuery({
    queryKey: onboardingKeys.titles,
    queryFn: ({ signal }) => getOnboardingTitles({ signal }),
    staleTime: 5 * 60_000,
  });

// `statusParam` is the grid's viewer-status key, refreshed once the batch lands.
export const useSaveTaste = (statusParam: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: TasteItem[]) => saveTaste(items),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: viewerStatusKeys.items(statusParam) }),
        // New taste, new matches.
        queryClient.removeQueries({ queryKey: [...socialKeys.all, "suggestions"] }),
      ]);
    },
  });
};

export const useCompleteOnboarding = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: completeOnboarding,
    onSuccess: (onboardingCompletedAt) => {
      queryClient.setQueryData<MeProfile | null>(authKeys.me, (old) =>
        old ? { ...old, onboardingCompletedAt } : old,
      );
    },
  });
};
