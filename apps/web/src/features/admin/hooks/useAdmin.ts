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
  reportsAll: ["admin", "reports"] as const,
  reports: (status?: ReportStatus) => ["admin", "reports", status ?? "all"] as const,
  usersAll: ["admin", "users"] as const,
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
      await queryClient.invalidateQueries({ queryKey: adminKeys.reportsAll });
    },
  });
};

export const useResolveReport = () => useReportAction(resolveReport);
export const useDismissReport = () => useReportAction(dismissReport);
export const useRemoveReportedContent = () => useReportAction(removeReportedContent);

export const useResetUserPassword = () => {
  return useMutation({
    mutationFn: ({
      username,
      newPassword,
      adminPassword,
    }: {
      username: string;
      newPassword: string;
      adminPassword: string;
    }) => resetUserPassword(username, newPassword, adminPassword),
  });
};

const useUserAction = <TInput>(mutationFn: (input: TInput) => Promise<void>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.usersAll });
    },
  });
};

export const useSuspendUser = () =>
  useUserAction(
    ({ username, reason, adminPassword }: { username: string; reason?: string; adminPassword: string }) =>
      suspendUser(username, adminPassword, reason),
  );

export const useUnsuspendUser = () => useUserAction(unsuspendUser);
type ConfirmedUserAction = { username: string; adminPassword: string };

export const usePromoteUser = () =>
  useUserAction(({ username, adminPassword }: ConfirmedUserAction) =>
    promoteUser(username, adminPassword),
  );
export const useDemoteUser = () =>
  useUserAction(({ username, adminPassword }: ConfirmedUserAction) =>
    demoteUser(username, adminPassword),
  );
export const useDeleteUser = () =>
  useUserAction(({ username, adminPassword }: ConfirmedUserAction) =>
    deleteUser(username, adminPassword),
  );
