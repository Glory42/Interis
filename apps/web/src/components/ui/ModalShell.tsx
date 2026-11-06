import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import FocusLock from "react-focus-lock";
import { cn } from "@/lib/utils";

const EXIT_DURATION_MS = 200;

// dialog: centred. sheet: bottom sheet on phones that leaves the page above
// visible and undimmed, a dialog from sm up. fullscreen: edge to edge.
export type ModalLayout = "dialog" | "sheet" | "fullscreen";

const overlayByLayout: Record<ModalLayout, string> = {
  dialog: "bg-[color:var(--theme-modal-overlay)]",
  sheet: "bg-transparent sm:bg-[color:var(--theme-modal-overlay)]",
  fullscreen: "bg-background",
};

const containerByLayout: Record<ModalLayout, string> = {
  dialog: "items-center p-4",
  sheet: "items-end p-0 sm:items-center sm:p-4",
  fullscreen: "items-stretch p-0",
};

type ModalShellProps = {
  onClose: () => void;
  children: ReactNode;
  overlayClassName?: string;
  containerClassName?: string;
  ariaCloseLabel?: string;
  closeOnEscape?: boolean;
  closeOnBackdropClick?: boolean;
  portal?: boolean;
  layout?: ModalLayout;
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
  layout = "dialog",
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
        "theme-modal-overlay fixed inset-0 z-140 transition-opacity duration-200 ease-(--ease-out)",
        overlayByLayout[layout],
        isClosing ? "opacity-0" : "opacity-100",
        overlayClassName,
      )}
      data-layout={layout}
      aria-label={closeOnBackdropClick ? ariaCloseLabel : undefined}
      onClick={closeOnBackdropClick ? requestClose : undefined}
    >
      <div
        className={cn(
          "relative mx-auto flex h-full w-full justify-center transition-[opacity,transform] duration-200 ease-(--ease-out)",
          containerByLayout[layout],
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
