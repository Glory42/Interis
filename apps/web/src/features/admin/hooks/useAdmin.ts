import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteUser,
  demoteUser,
  dismissReport,
  listAdminUsers,
  listReports,
  promoteUser,
  removeReportedContent,
  resetUserPassword,
  resolveReport,
  suspendUser,
  unsuspendUser,
  type ReportStatus,
} from "@/features/admin/api";

export const adminKeys = {
  reports: (status?: ReportStatus) => ["admin", "reports", status ?? "all"] as const,
  users: (query?: string) => ["admin", "users", query ?? ""] as const,
};

export const useAdminReports = (status?: ReportStatus) =>
  useQuery({
    queryKey: adminKeys.reports(status),
    queryFn: () => listReports(status),
  });

export const useAdminUsers = (query?: string) =>
  useQuery({
    queryKey: adminKeys.users(query),
    queryFn: () => listAdminUsers(query),
  });

const useReportAction = (mutationFn: (id: string) => Promise<void>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
    },
  });
};

export const useResolveReport = () => useReportAction(resolveReport);
export const useDismissReport = () => useReportAction(dismissReport);
export const useRemoveReportedContent = () => useReportAction(removeReportedContent);

export const useResetUserPassword = () => {
  return useMutation({
    mutationFn: ({ username, newPassword }: { username: string; newPassword: string }) =>
      resetUserPassword(username, newPassword),
  });
};

const useUserAction = <TInput>(mutationFn: (input: TInput) => Promise<void>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
};

export const useSuspendUser = () =>
  useUserAction(({ username, reason }: { username: string; reason?: string }) =>
    suspendUser(username, reason),
  );

export const useUnsuspendUser = () => useUserAction(unsuspendUser);
export const usePromoteUser = () => useUserAction(promoteUser);
export const useDemoteUser = () => useUserAction(demoteUser);
export const useDeleteUser = () => useUserAction(deleteUser);
