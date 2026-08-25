import { useDeferredValue, useState } from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminConfirmDialog } from "@/features/admin/components/AdminConfirmDialog";
import { AdminPanelHeader } from "@/features/admin/components/AdminPanelHeader";
import { AdminPanelState } from "@/features/admin/components/AdminPanelState";
import { AdminSearchInput } from "@/features/admin/components/AdminSearchInput";
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
      <Button
        type="button"
        variant="ghost"
        size="sm"
        title="Delete"
        aria-label="Delete"
        className="h-7 w-7 p-0 text-destructive/80 hover:text-destructive"
        onClick={() => setIsOpen(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
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
      <AdminPanelHeader
        title="Lists"
        description="Moderate user-created lists."
        action={
          <AdminSearchInput
            value={usernameInput}
            onChange={(event) => setUsernameInput(event.target.value)}
            placeholder="Filter by username..."
          />
        }
      />

      <AdminPanelState query={listsQuery} emptyMessage="No lists found." errorMessage="Could not load lists.">
        {(lists) => (
          <Card>
            <Table>
              <TableHeader>
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead>Title</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lists.map((list) => (
                  <TableRow key={list.id}>
                    <TableCell className="text-foreground">{list.title}</TableCell>
                    <TableCell className="text-muted-foreground">@{list.authorUsername}</TableCell>
                    <TableCell className="text-muted-foreground">{list.itemCount}</TableCell>
                    <TableCell>
                      <Badge variant="muted">{list.isPublic ? "Public" : "Private"}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatRelativeTime(list.createdAt.toISOString())}
                    </TableCell>
                    <TableCell>
                      <DeleteListAction list={list} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </AdminPanelState>
    </div>
  );
};
