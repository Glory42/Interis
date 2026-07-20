import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import FocusLock from "react-focus-lock";
import { Loader2, X } from "lucide-react";

type AdminConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmLabel: string;
  variant?: "default" | "danger";
  isConfirmDisabled?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  children?: ReactNode;
};

export const AdminConfirmDialog = (props: AdminConfirmDialogProps) =>
  props.isOpen ? <AdminConfirmDialogContent {...props} /> : null;

const AdminConfirmDialogContent = ({
  onClose,
  title,
  description,
  confirmLabel,
  variant = "default",
  isConfirmDisabled = false,
  isLoading = false,
  error,
  onConfirm,
  children,
}: AdminConfirmDialogProps) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div className="theme-modal-overlay fixed inset-0 z-140 bg-background/70 backdrop-blur-sm">
      <button
        type="button"
        aria-label={`Close ${title} dialog`}
        className="absolute inset-0"
        onClick={onClose}
      />

      <div className="relative mx-auto flex h-full w-full max-w-md items-center justify-center p-4">
        <FocusLock returnFocus className="contents">
          <section className="theme-modal-panel relative w-full overflow-hidden border border-border/80 bg-card/95 p-0 animate-fade-up">
            <div className="flex items-start justify-between border-b border-border/70 px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {title}
              </p>
              <button
                type="button"
                onClick={onClose}
                aria-label={`Close ${title} dialog`}
                className="inline-flex h-7 w-7 items-center justify-center border border-border/70 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 px-4 py-4">
              {description ? <p className="text-sm text-foreground">{description}</p> : null}
              {children}

              {error ? <p className="text-xs text-destructive">{error}</p> : null}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="border border-border/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
                >
                  cancel
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isConfirmDisabled || isLoading}
                  className={
                    "border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-50 " +
                    (variant === "danger"
                      ? "border-destructive/45 bg-destructive/10 text-destructive"
                      : "border-primary/45 bg-primary/10 text-primary")
                  }
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> working
                    </span>
                  ) : (
                    confirmLabel
                  )}
                </button>
              </div>
            </div>
          </section>
        </FocusLock>
      </div>
    </div>,
    document.body,
  );
};
