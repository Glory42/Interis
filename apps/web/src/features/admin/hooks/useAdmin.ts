import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  dismissReport,
  listAdminUsers,
  listReports,
  removeReportedContent,
  resolveReport,
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
