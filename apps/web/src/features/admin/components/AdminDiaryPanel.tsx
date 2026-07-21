import { useDeferredValue, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminConfirmDialog } from "@/features/admin/components/AdminConfirmDialog";
import { AdminPanelHeader } from "@/features/admin/components/AdminPanelHeader";
import { AdminPanelState } from "@/features/admin/components/AdminPanelState";
import { AdminSearchInput } from "@/features/admin/components/AdminSearchInput";
import type { AdminDiaryEntry } from "@/features/admin/content-api";
import {
  useAdminDiaryEntries,
  useDeleteAdminDiaryEntry,
} from "@/features/admin/hooks/useAdminContent";
import { isApiError } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/time";

const DeleteDiaryEntryAction = ({ entry }: { entry: AdminDiaryEntry }) => {
  const { mutateAsync: deleteEntry, isPending } = useDeleteAdminDiaryEntry();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      await deleteEntry(entry.id);
      setIsOpen(false);
    } catch (submitError) {
      setError(isApiError(submitError) ? submitError.message : "Could not delete diary entry.");
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
        title="Delete diary entry"
        description={`Permanently delete @${entry.authorUsername}'s log of ${entry.movieTitle}?`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isPending}
        error={error}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
};

export const AdminDiaryPanel = () => {
  const [usernameInput, setUsernameInput] = useState("");
  const deferredUsername = useDeferredValue(usernameInput.trim());
  const entriesQuery = useAdminDiaryEntries({
    username: deferredUsername.length > 0 ? deferredUsername : undefined,
  });

  return (
    <div className="space-y-4">
      <AdminPanelHeader
        title="Diary"
        description="Moderate logged watches across the archive."
        action={
          <AdminSearchInput
            value={usernameInput}
            onChange={(event) => setUsernameInput(event.target.value)}
            placeholder="Filter by username..."
          />
        }
      />

      <AdminPanelState
        query={entriesQuery}
        emptyMessage="No diary entries found."
        errorMessage="Could not load diary entries."
      >
        {(entries) => (
          <Card>
            <Table>
              <TableHeader>
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead>User</TableHead>
                  <TableHead>Movie</TableHead>
                  <TableHead>Watched</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Logged</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-foreground">@{entry.authorUsername}</TableCell>
                    <TableCell className="text-muted-foreground">{entry.movieTitle}</TableCell>
                    <TableCell className="text-muted-foreground">{entry.watchedDate}</TableCell>
                    <TableCell className="text-muted-foreground">{entry.rating ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatRelativeTime(entry.createdAt.toISOString())}
                    </TableCell>
                    <TableCell>
                      <DeleteDiaryEntryAction entry={entry} />
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
