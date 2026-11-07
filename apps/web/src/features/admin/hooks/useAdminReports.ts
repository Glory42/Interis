import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReportStatus } from "@/features/admin/api";
import { removeReportedContent } from "@/features/admin/api";
import { adminKeys } from "@/features/admin/hooks/useAdmin";
import { useAdminPagedList } from "@/features/admin/hooks/useAdminPagedList";
import { dismissReportTarget, listGroupedReports } from "@/features/admin/reports-api";

export const useGroupedReports = (status: ReportStatus) =>
  useAdminPagedList([...adminKeys.reportsAll, "grouped", status], (page) => listGroupedReports(status, page));

// Closing an item changes the queue and the overview's counts, nothing else.
const useReportQueueAction = <TInput>(mutationFn: (input: TInput) => Promise<void>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.reportsAll }),
        queryClient.invalidateQueries({ queryKey: adminKeys.overview }),
      ]);
    },
  });
};

export const useRemoveAndResolve = () =>
  useReportQueueAction(({ reportId, note }: { reportId: string; note: string }) =>
    removeReportedContent(reportId, { reason: note.trim() || undefined, notifyAuthor: true }),
  );

export const useDismissReportTarget = () => useReportQueueAction(dismissReportTarget);
