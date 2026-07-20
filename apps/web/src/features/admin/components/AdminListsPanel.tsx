import { useDeferredValue, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AdminConfirmDialog } from "@/features/admin/components/AdminConfirmDialog";
import type { AdminList } from "@/features/admin/community-api";
import { useAdminLists, useDeleteAdminList } from "@/features/admin/hooks/useAdminCommunity";
import { isApiError } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/time";

const DeleteListAction = ({ list }: { list: AdminList }) => {
  const { mutateAsync: deleteList, isPending } = useDeleteAdminList();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      await deleteList(list.id);
      setIsOpen(false);
    } catch (submitError) {
      setError(isApiError(submitError) ? submitError.message : "Could not delete list.");
    }
  };

  return (
    <>
      <button
        type="button"
        className="text-xs text-destructive/80 hover:text-destructive"
        onClick={() => setIsOpen(true)}
      >
        Delete
      </button>
      <AdminConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Delete list"
        description={`Permanently delete @${list.authorUsername}'s list "${list.title}" (${list.itemCount} items)?`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isPending}
        error={error}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
};

export const AdminListsPanel = () => {
  const [usernameInput, setUsernameInput] = useState("");
  const deferredUsername = useDeferredValue(usernameInput.trim());
  const listsQuery = useAdminLists(deferredUsername.length > 0 ? deferredUsername : undefined);

  return (
    <div className="space-y-4">
      <Input
        value={usernameInput}
        onChange={(event) => setUsernameInput(event.target.value)}
        placeholder="Filter by username..."
        className="max-w-sm"
      />

      {listsQuery.isPending ? (
        <div className="flex items-center justify-center py-10">
          <Spinner />
        </div>
      ) : listsQuery.isError ? (
        <p className="text-sm text-muted-foreground">Could not load lists.</p>
      ) : listsQuery.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No lists found.</p>
      ) : (
        <div className="border border-border/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Items</th>
                <th className="px-3 py-2">Visibility</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listsQuery.data.map((list) => (
                <tr key={list.id} className="border-b border-border/40 last:border-0">
                  <td className="px-3 py-2 text-foreground">{list.title}</td>
                  <td className="px-3 py-2 text-muted-foreground">@{list.authorUsername}</td>
                  <td className="px-3 py-2 text-muted-foreground">{list.itemCount}</td>
                  <td className="px-3 py-2">
                    <Badge variant="muted">{list.isPublic ? "Public" : "Private"}</Badge>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {formatRelativeTime(list.createdAt.toISOString())}
                  </td>
                  <td className="px-3 py-2">
                    <DeleteListAction list={list} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
