import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { MediaKind } from "@/features/media/media-cache";

type UnwatchMediaDialogProps = {
  kind: MediaKind;
  onConfirm: (clearLikeAndRating: boolean) => void;
  onClose: () => void;
};

// Asked before marking a liked or rated Film or Series not watched (#93). Render it
// only while open so the checkbox starts unticked each time.
export const UnwatchMediaDialog = ({ kind, onConfirm, onClose }: UnwatchMediaDialogProps) => {
  const [clearLikeAndRating, setClearLikeAndRating] = useState(false);

  return (
    <ConfirmDialog
      isOpen
      title="Mark as not watched?"
      description={kind === "film" ? "You've liked or rated this movie." : "You've liked or rated this show."}
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
            {kind === "film" ? "Your logs and reviews stay." : "Your logs and reviews stay; episode progress is cleared."}
          </span>
        </span>
      </label>
    </ConfirmDialog>
  );
};
