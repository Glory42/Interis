import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteAdminComment, listAdminComments, listAuditLog } from "@/features/admin/audit-comments-api";
import { useAdminPagedList } from "@/features/admin/hooks/useAdminPagedList";

const commentsKey = ["admin", "comments"] as const;
const auditKey = (actor: string) => ["admin", "audit", actor] as const;

export const useAdminComments = () => useAdminPagedList(commentsKey, listAdminComments);

export const useDeleteAdminComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminComment,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: commentsKey }),
        queryClient.invalidateQueries({ queryKey: ["admin", "audit"] }),
      ]);
    },
  });
};

// Cursor-paged, newest first; "Older →" fetches the next page.
export const useAuditLog = (actor: string) =>
  useInfiniteQuery({
    queryKey: auditKey(actor),
    queryFn: ({ pageParam }) => listAuditLog({ actor: actor || undefined, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: (data) => data.pages.flatMap((page) => page.items),
  });
