import { useState } from "react";
import { Pencil, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminConfirmDialog } from "@/features/admin/components/AdminConfirmDialog";
import type { AdminSerial } from "@/features/admin/media-api";
import {
  useDeleteAdminSerial,
  useRefreshAdminSerial,
  useUpdateAdminSerial,
} from "@/features/admin/hooks/useAdminMedia";
import { isApiError } from "@/lib/api-client";

export const EditSerialAction = ({ serial }: { serial: AdminSerial }) => {
  const { mutateAsync: updateSerial, isPending } = useUpdateAdminSerial();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(serial.title);
  const [creator, setCreator] = useState(serial.creator ?? "");
  const [overview, setOverview] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      await updateSerial({
        id: serial.id,
        fields: {
          title: title.trim() || undefined,
          creator: creator.trim().length > 0 ? creator.trim() : null,
          overview: overview.trim().length > 0 ? overview.trim() : undefined,
        },
      });
      setIsOpen(false);
    } catch (submitError) {
      setError(isApiError(submitError) ? submitError.message : "Could not update series.");
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        title="Edit"
        aria-label="Edit"
        className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
        onClick={() => setIsOpen(true)}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <AdminConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Edit series"
        confirmLabel="Save"
        isLoading={isPending}
        isConfirmDisabled={title.trim().length === 0}
        error={error}
        onConfirm={() => void handleConfirm()}
      >
        <div className="space-y-2">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            className="h-8 text-sm"
          />
          <Input
            value={creator}
            onChange={(event) => setCreator(event.target.value)}
            placeholder="Creator"
            className="h-8 text-sm"
          />
          <Textarea
            value={overview}
            onChange={(event) => setOverview(event.target.value)}
            placeholder="Overview (leave blank to keep current)"
            className="min-h-20 text-sm"
          />
        </div>
      </AdminConfirmDialog>
    </>
  );
};

export const RefreshSerialAction = ({ serial }: { serial: AdminSerial }) => {
  const { mutateAsync: refreshSerial, isPending } = useRefreshAdminSerial();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      await refreshSerial(serial.id);
      setIsOpen(false);
    } catch (submitError) {
      setError(isApiError(submitError) ? submitError.message : "Could not refresh from TMDB.");
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        title="Refresh from TMDB"
        aria-label="Refresh from TMDB"
        className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
        onClick={() => setIsOpen(true)}
      >
        <RefreshCw className="h-3.5 w-3.5" />
      </Button>
      <AdminConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Refresh from TMDB"
        description={`Re-fetch ${serial.title} from TMDB, overwriting any local corrections?`}
        confirmLabel="Refresh"
        isLoading={isPending}
        error={error}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
};

export const DeleteSerialAction = ({ serial }: { serial: AdminSerial }) => {
  const { mutateAsync: deleteSerial, isPending } = useDeleteAdminSerial();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (confirmText !== serial.title) return;
    setError(null);
    try {
      await deleteSerial(serial.id);
      setIsOpen(false);
    } catch (submitError) {
      setError(isApiError(submitError) ? submitError.message : "Could not delete series.");
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
        onClick={() => {
          setIsOpen(true);
          setConfirmText("");
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
      <AdminConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Delete series"
        description={`This removes ${serial.title} and every diary entry, interaction, and list entry across all users that references it. This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isPending}
        isConfirmDisabled={confirmText !== serial.title}
        error={error}
        onConfirm={() => void handleConfirm()}
      >
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Type <span className="font-mono">{serial.title}</span> to confirm:
          </p>
          <Input
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder={serial.title}
            className="h-8 text-sm"
          />
        </div>
      </AdminConfirmDialog>
    </>
  );
};
