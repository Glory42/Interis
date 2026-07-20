import { useDeferredValue, useState } from "react";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AdminConfirmDialog } from "@/features/admin/components/AdminConfirmDialog";
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
      <Input
        value={usernameInput}
        onChange={(event) => setUsernameInput(event.target.value)}
        placeholder="Filter by username..."
        className="max-w-sm"
      />

      {entriesQuery.isPending ? (
        <div className="flex items-center justify-center py-10">
          <Spinner />
        </div>
      ) : entriesQuery.isError ? (
        <p className="text-sm text-muted-foreground">Could not load diary entries.</p>
      ) : entriesQuery.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No diary entries found.</p>
      ) : (
        <div className="border border-border/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Movie</th>
                <th className="px-3 py-2">Watched</th>
                <th className="px-3 py-2">Rating</th>
                <th className="px-3 py-2">Logged</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entriesQuery.data.map((entry) => (
                <tr key={entry.id} className="border-b border-border/40 last:border-0">
                  <td className="px-3 py-2 text-foreground">@{entry.authorUsername}</td>
                  <td className="px-3 py-2 text-muted-foreground">{entry.movieTitle}</td>
                  <td className="px-3 py-2 text-muted-foreground">{entry.watchedDate}</td>
                  <td className="px-3 py-2 text-muted-foreground">{entry.rating ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {formatRelativeTime(entry.createdAt.toISOString())}
                  </td>
                  <td className="px-3 py-2">
                    <DeleteDiaryEntryAction entry={entry} />
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
