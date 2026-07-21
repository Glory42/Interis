import { useEffect } from "react";
import { createPortal } from "react-dom";
import FocusLock from "react-focus-lock";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isConfirming?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

// Generic confirm/cancel popup for destructive actions (delete a comment,
// remove an item, etc.) — reusable across features instead of the browser's
// native confirm(), following the project's custom modal pattern.
export const ConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = false,
  isConfirming = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="theme-modal-overlay fixed inset-0 z-150 flex items-center justify-center bg-background/70 px-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0"
        onClick={onClose}
      />

      <FocusLock returnFocus className="contents">
        <section className="theme-modal-panel relative z-10 w-full max-w-sm border border-border/80 bg-card/95 p-5 animate-fade-up">
          <h2 className="text-sm font-bold text-foreground">{title}</h2>

          {description ? (
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          ) : null}

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isConfirming}
              className="border border-border/70 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isConfirming}
              className={cn(
                "inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                isDestructive
                  ? "border-destructive/45 bg-destructive/10 text-destructive hover:bg-destructive/15"
                  : "border-primary/45 bg-primary/10 text-primary hover:bg-primary/15",
              )}
            >
              {isConfirming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {confirmLabel}
            </button>
          </div>
        </section>
      </FocusLock>
    </div>,
    document.body,
  );
};
