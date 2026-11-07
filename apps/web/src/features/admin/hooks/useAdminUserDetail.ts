import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { unsuspendUser } from "@/features/admin/api";
import { adminKeys } from "@/features/admin/hooks/useAdmin";
import {
  demoteFromAdmin,
  forcePasswordReset,
  getAdminUserDetail,
  promoteToAdmin,
  revokeUserSessions,
  suspendUserFor,
} from "@/features/admin/user-detail-api";

const detailKey = (username: string) => [...adminKeys.usersAll, "detail", username] as const;

export const useAdminUserDetail = (username: string) =>
  useQuery({ queryKey: detailKey(username), queryFn: () => getAdminUserDetail(username) });

// An account action changes this page, the user list and the overview's counts.
const useAccountAction = <TInput extends { username: string }>(mutationFn: (input: TInput) => Promise<void>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        // usersAll covers the lists and this detail page; other details are rarely cached.
        queryClient.invalidateQueries({ queryKey: adminKeys.usersAll }),
        queryClient.invalidateQueries({ queryKey: adminKeys.overview }),
      ]);
    },
  });
};

export const useSuspendFor = () => useAccountAction(suspendUserFor);
export const useLiftSuspension = () => useAccountAction(({ username }: { username: string }) => unsuspendUser(username));
export const useRevokeSessions = () => useAccountAction(revokeUserSessions);
export const useForceReset = () => useAccountAction(forcePasswordReset);
export const usePromote = () => useAccountAction(promoteToAdmin);
export const useDemote = () => useAccountAction(demoteFromAdmin);
