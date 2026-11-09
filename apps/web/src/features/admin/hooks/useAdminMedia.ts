import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminPagedList } from "@/features/admin/hooks/useAdminPagedList";
import {
  deleteAdminMedia,
  listAdminMedia,
  refreshAdminMedia,
  updateAdminMedia,
  type AdminMediaKind,
  type AdminMediaUpdate,
} from "@/features/admin/media-api";

export const adminMediaKeys = {
  all: (kind: AdminMediaKind) => ["admin", kind === "movie" ? "movies" : "serials"] as const,
  list: (kind: AdminMediaKind, query?: string) => [...adminMediaKeys.all(kind), query ?? ""] as const,
};

export const useAdminMediaList = (kind: AdminMediaKind, query?: string) =>
  useAdminPagedList(adminMediaKeys.list(kind, query), (page) => listAdminMedia(kind, query, page));

// Edit, refresh and delete for one media kind; each refetches only that kind's admin list.
export const useAdminMediaAction = (kind: AdminMediaKind) => {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: adminMediaKeys.all(kind) });

  return {
    update: useMutation({
      mutationFn: ({ id, fields }: { id: number; fields: AdminMediaUpdate }) => updateAdminMedia(kind, id, fields),
      onSuccess,
    }),
    refresh: useMutation({ mutationFn: (id: number) => refreshAdminMedia(kind, id), onSuccess }),
    remove: useMutation({ mutationFn: (id: number) => deleteAdminMedia(kind, id), onSuccess }),
  };
};
