import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import FocusLock from "react-focus-lock";
import { cn } from "@/lib/utils";

type ModalShellProps = {
  onClose: () => void;
  children: ReactNode;
  overlayClassName?: string;
  containerClassName?: string;
  ariaCloseLabel?: string;
  closeOnEscape?: boolean;
  closeOnBackdropClick?: boolean;
  portal?: boolean;
};

// Shared chrome for the project's custom modal pattern (see CLAUDE.md): a
// portaled overlay with FocusLock, backdrop-click-to-close and Escape-to-close.
// Callers own everything inside — their own header/body/footer markup.
export const ModalShell = ({
  onClose,
  children,
  overlayClassName,
  containerClassName,
  ariaCloseLabel = "Close dialog",
  closeOnEscape = true,
  closeOnBackdropClick = true,
  portal = true,
}: ModalShellProps) => {
  useEffect(() => {
    if (!closeOnEscape) {
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
  }, [closeOnEscape, onClose]);

  const content = (
    <div
      className={cn(
        "theme-modal-overlay fixed inset-0 z-140 bg-background/70 backdrop-blur-sm",
        overlayClassName,
      )}
      aria-label={closeOnBackdropClick ? ariaCloseLabel : undefined}
      onClick={closeOnBackdropClick ? onClose : undefined}
    >
      <div
        className={cn(
          "relative mx-auto flex h-full w-full items-center justify-center p-4",
          containerClassName,
        )}
      >
        <FocusLock returnFocus className="contents">
          <div className="contents" onClick={(event) => event.stopPropagation()}>
            {children}
          </div>
        </FocusLock>
      </div>
    </div>
  );

  return portal ? createPortal(content, document.body) : content;
};
