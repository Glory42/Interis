import { useDeferredValue, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import type { MediaType } from "@/types/api";

const DeleteDiaryEntryAction = ({ entry }: { entry: AdminDiaryEntry }) => {
  const { mutateAsync: deleteEntry, isPending } = useDeleteAdminDiaryEntry();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      await deleteEntry(entry);
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
        description={`Permanently delete @${entry.authorUsername}'s log of ${entry.mediaTitle}?`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isPending}
        error={error}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
};

const MEDIA_TABS: { value: MediaType; label: string }[] = [
  { value: "movie", label: "Films" },
  { value: "tv", label: "TV" },
];

export const AdminDiaryPanel = () => {
  const [usernameInput, setUsernameInput] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("movie");
  const deferredUsername = useDeferredValue(usernameInput.trim());
  const entriesQuery = useAdminDiaryEntries({
    username: deferredUsername.length > 0 ? deferredUsername : undefined,
    mediaType,
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

      <div role="toolbar" aria-label="Log media type" className="mono-meta flex items-center gap-4 uppercase">
        {MEDIA_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            aria-pressed={mediaType === tab.value}
            onClick={() => setMediaType(tab.value)}
            className={cn(mediaType === tab.value ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AdminPanelState
        query={entriesQuery}
        emptyMessage="No diary entries found."
        errorMessage="Could not load diary entries."
      >
        {(entries) => (
          <div className="surface">
            <Table>
              <TableHeader>
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead>User</TableHead>
                  <TableHead>Title</TableHead>
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
                    <TableCell className="text-muted-foreground">{entry.mediaTitle}</TableCell>
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
          </div>
        )}
      </AdminPanelState>
    </div>
  );
};
