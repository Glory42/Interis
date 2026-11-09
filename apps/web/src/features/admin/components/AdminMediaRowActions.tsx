import { useState } from "react";
import { Pencil, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminConfirmDialog } from "@/features/admin/components/AdminConfirmDialog";
import { useAdminMediaAction } from "@/features/admin/hooks/useAdminMedia";
import type { AdminMediaKind, AdminMediaTitle } from "@/features/admin/media-api";
import { ADMIN_MEDIA_KINDS } from "@/features/admin/media-kinds";
import { isApiError } from "@/lib/api-client";

type ActionProps = { kind: AdminMediaKind; media: AdminMediaTitle };

const EditMediaAction = ({ kind, media }: ActionProps) => {
  const { noun, creditLabel } = ADMIN_MEDIA_KINDS[kind];
  const { mutateAsync: update, isPending } = useAdminMediaAction(kind).update;
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(media.title);
  const [credit, setCredit] = useState(media.credit ?? "");
  const [overview, setOverview] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      await update({
        id: media.id,
        fields: {
          title: title.trim() || undefined,
          credit: credit.trim().length > 0 ? credit.trim() : null,
          overview: overview.trim().length > 0 ? overview.trim() : undefined,
        },
      });
      setIsOpen(false);
    } catch (submitError) {
      setError(isApiError(submitError) ? submitError.message : `Could not update ${noun}.`);
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
        title={`Edit ${noun}`}
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
            value={credit}
            onChange={(event) => setCredit(event.target.value)}
            placeholder={creditLabel}
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

const RefreshMediaAction = ({ kind, media }: ActionProps) => {
  const { mutateAsync: refresh, isPending } = useAdminMediaAction(kind).refresh;
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      await refresh(media.id);
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
        description={`Re-fetch ${media.title} from TMDB, overwriting any local corrections?`}
        confirmLabel="Refresh"
        isLoading={isPending}
        error={error}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
};

const DeleteMediaAction = ({ kind, media }: ActionProps) => {
  const { noun, deleteReach } = ADMIN_MEDIA_KINDS[kind];
  const { mutateAsync: remove, isPending } = useAdminMediaAction(kind).remove;
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (confirmText !== media.title) return;
    setError(null);
    try {
      await remove(media.id);
      setIsOpen(false);
    } catch (submitError) {
      setError(isApiError(submitError) ? submitError.message : `Could not delete ${noun}.`);
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
        title={`Delete ${noun}`}
        description={`This removes ${media.title} and ${deleteReach} across all users that references it. This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isPending}
        isConfirmDisabled={confirmText !== media.title}
        error={error}
        onConfirm={() => void handleConfirm()}
      >
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Type <span className="font-mono">{media.title}</span> to confirm:
          </p>
          <Input
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder={media.title}
            className="h-8 text-sm"
          />
        </div>
      </AdminConfirmDialog>
    </>
  );
};

export const AdminMediaRowActions = ({ kind, media }: ActionProps) => (
  <div className="flex items-center gap-1">
    <EditMediaAction kind={kind} media={media} />
    <RefreshMediaAction kind={kind} media={media} />
    <DeleteMediaAction kind={kind} media={media} />
  </div>
);
