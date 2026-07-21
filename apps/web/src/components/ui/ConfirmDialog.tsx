import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { ModalShell } from "@/components/ui/ModalShell";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isConfirming?: boolean;
  isConfirmDisabled?: boolean;
  loadingLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  // "simple": h2 title, no header bar (default — comment/item delete popups).
  // "panel": bordered header bar with an X-close button, plus room for
  // arbitrary body content and an error message (used by admin actions).
  variant?: "simple" | "panel";
  maxWidthClassName?: string;
  children?: ReactNode;
  error?: string | null;
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
  isConfirmDisabled = false,
  loadingLabel,
  onConfirm,
  onClose,
  variant = "simple",
  maxWidthClassName = "max-w-sm",
  children,
  error,
}: ConfirmDialogProps) => {
  if (!isOpen) {
    return null;
  }

  const confirmButton = (
    <button
      type="button"
      onClick={onConfirm}
      disabled={isConfirming || isConfirmDisabled}
      className={cn(
        "inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variant === "panel" && "font-mono text-[10px] uppercase tracking-[0.12em] px-2.5 py-1",
        isDestructive
          ? "border-destructive/45 bg-destructive/10 text-destructive hover:bg-destructive/15"
          : "border-primary/45 bg-primary/10 text-primary hover:bg-primary/15",
      )}
    >
      {isConfirming ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {loadingLabel ?? confirmLabel}
        </>
      ) : (
        confirmLabel
      )}
    </button>
  );

  const cancelButton = (
    <button
      type="button"
      onClick={onClose}
      disabled={isConfirming}
      className={cn(
        "border border-border/70 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
        variant === "panel" && "font-mono text-[10px] uppercase tracking-[0.12em] px-2.5 py-1",
      )}
    >
      {cancelLabel}
    </button>
  );

  if (variant === "panel") {
    return (
      <ModalShell onClose={onClose} containerClassName={maxWidthClassName} ariaCloseLabel={`Close ${title} dialog`}>
        <section className="theme-modal-panel relative w-full overflow-hidden border border-border/80 bg-card/95 p-0 animate-fade-up">
          <ModalHeader title={title} onClose={onClose} closeAriaLabel={`Close ${title} dialog`} />

          <div className="space-y-3 px-4 py-4">
            {description ? <p className="text-sm text-foreground">{description}</p> : null}
            {children}

            {error ? <p className="text-xs text-destructive">{error}</p> : null}

            <div className="flex items-center justify-end gap-2 pt-1">
              {cancelButton}
              {confirmButton}
            </div>
          </div>
        </section>
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={onClose} containerClassName={maxWidthClassName} overlayClassName="z-150">
      <section className="theme-modal-panel relative w-full border border-border/80 bg-card/95 p-5 animate-fade-up">
        <h2 className="text-sm font-bold text-foreground">{title}</h2>

        {description ? (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        ) : null}

        {children}

        <div className="mt-5 flex items-center justify-end gap-2">
          {cancelButton}
          {confirmButton}
        </div>
      </section>
    </ModalShell>
  );
};
