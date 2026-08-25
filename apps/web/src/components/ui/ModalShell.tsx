import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import FocusLock from "react-focus-lock";
import { cn } from "@/lib/utils";

const EXIT_DURATION_MS = 200;

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
  const [isClosing, setIsClosing] = useState(false);

  const requestClose = () => {
    setIsClosing(true);
  };

  useEffect(() => {
    if (!isClosing) {
      return;
    }
    const timeoutId = window.setTimeout(onClose, EXIT_DURATION_MS);
    return () => window.clearTimeout(timeoutId);
  }, [isClosing, onClose]);

  useEffect(() => {
    if (!closeOnEscape) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        requestClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeOnEscape]);

  const content = (
    <div
      className={cn(
        "theme-modal-overlay fixed inset-0 z-140 bg-background/70 backdrop-blur-sm transition-opacity duration-200 ease-(--ease-out)",
        isClosing ? "opacity-0" : "opacity-100",
        overlayClassName,
      )}
      aria-label={closeOnBackdropClick ? ariaCloseLabel : undefined}
      onClick={closeOnBackdropClick ? requestClose : undefined}
    >
      <div
        className={cn(
          "relative mx-auto flex h-full w-full items-center justify-center p-4 transition-[opacity,transform] duration-200 ease-(--ease-out)",
          isClosing ? "translate-y-2 scale-[0.98] opacity-0" : "translate-y-0 scale-100 opacity-100",
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
