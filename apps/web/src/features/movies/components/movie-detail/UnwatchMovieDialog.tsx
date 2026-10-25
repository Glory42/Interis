import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type UnwatchMovieDialogProps = {
  onConfirm: (clearLikeAndRating: boolean) => void;
  onClose: () => void;
};

// Asked before marking a liked or rated movie not watched (#93). Render it
// only while open so the checkbox starts unticked each time.
export const UnwatchMovieDialog = ({ onConfirm, onClose }: UnwatchMovieDialogProps) => {
  const [clearLikeAndRating, setClearLikeAndRating] = useState(false);

  return (
    <ConfirmDialog
      isOpen
      title="Mark as not watched?"
      description="You've liked or rated this movie."
      confirmLabel="Mark not watched"
      onConfirm={() => onConfirm(clearLikeAndRating)}
      onClose={onClose}
    >
      <label className="mt-3 flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={clearLikeAndRating}
          onChange={(event) => setClearLikeAndRating(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 border-border bg-input accent-primary"
        />
        <span className="text-sm text-foreground">
          Also remove your like and rating
          <span className="block text-xs text-muted-foreground">
            Your logs and reviews stay.
          </span>
        </span>
      </label>
    </ConfirmDialog>
  );
};
