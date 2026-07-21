import { useState } from "react";
import { Pencil, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminConfirmDialog } from "@/features/admin/components/AdminConfirmDialog";
import type { AdminMovie } from "@/features/admin/media-api";
import {
  useDeleteAdminMovie,
  useRefreshAdminMovie,
  useUpdateAdminMovie,
} from "@/features/admin/hooks/useAdminMedia";
import { isApiError } from "@/lib/api-client";

export const EditMovieAction = ({ movie }: { movie: AdminMovie }) => {
  const { mutateAsync: updateMovie, isPending } = useUpdateAdminMovie();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(movie.title);
  const [director, setDirector] = useState(movie.director ?? "");
  const [overview, setOverview] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      await updateMovie({
        id: movie.id,
        fields: {
          title: title.trim() || undefined,
          director: director.trim().length > 0 ? director.trim() : null,
          overview: overview.trim().length > 0 ? overview.trim() : undefined,
        },
      });
      setIsOpen(false);
    } catch (submitError) {
      setError(isApiError(submitError) ? submitError.message : "Could not update movie.");
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
        title="Edit movie"
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
            value={director}
            onChange={(event) => setDirector(event.target.value)}
            placeholder="Director"
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

export const RefreshMovieAction = ({ movie }: { movie: AdminMovie }) => {
  const { mutateAsync: refreshMovie, isPending } = useRefreshAdminMovie();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      await refreshMovie(movie.id);
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
        description={`Re-fetch ${movie.title} from TMDB, overwriting any local corrections?`}
        confirmLabel="Refresh"
        isLoading={isPending}
        error={error}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
};

export const DeleteMovieAction = ({ movie }: { movie: AdminMovie }) => {
  const { mutateAsync: deleteMovie, isPending } = useDeleteAdminMovie();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (confirmText !== movie.title) return;
    setError(null);
    try {
      await deleteMovie(movie.id);
      setIsOpen(false);
    } catch (submitError) {
      setError(isApiError(submitError) ? submitError.message : "Could not delete movie.");
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
        title="Delete movie"
        description={`This removes ${movie.title} and every diary entry, review, interaction, and list entry across all users that references it. This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isPending}
        isConfirmDisabled={confirmText !== movie.title}
        error={error}
        onConfirm={() => void handleConfirm()}
      >
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Type <span className="font-mono">{movie.title}</span> to confirm:
          </p>
          <Input
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder={movie.title}
            className="h-8 text-sm"
          />
        </div>
      </AdminConfirmDialog>
    </>
  );
};
