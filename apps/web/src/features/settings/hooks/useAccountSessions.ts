import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccountSessions, revokeAccountSession, revokeOtherAccountSessions } from "@/features/settings/api";

export const sessionKeys = {
  list: ["auth", "sessions"] as const,
};

export const useAccountSessions = () =>
  useQuery({ queryKey: sessionKeys.list, queryFn: getAccountSessions, staleTime: 30_000 });

// Revoking only changes the session list, so that is the only key refreshed.
export const useRevokeAccountSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeAccountSession,
    onSettled: () => queryClient.invalidateQueries({ queryKey: sessionKeys.list }),
  });
};

export const useRevokeOtherAccountSessions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeOtherAccountSessions,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKeys.list }),
  });
};
