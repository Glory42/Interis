import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalHeaderProps = {
  title: ReactNode;
  onClose: () => void;
  closeAriaLabel?: string;
  align?: "start" | "center";
};

// The title-row + X-close-button header shared by most dialogs built on ModalShell.
export const ModalHeader = ({
  title,
  onClose,
  closeAriaLabel = "Close dialog",
  align = "center",
}: ModalHeaderProps) => (
  <div
    className={cn(
      "flex justify-between border-b border-border/70 px-4 py-3",
      align === "start" ? "items-start" : "items-center",
    )}
  >
    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
      {title}
    </p>
    <button
      type="button"
      onClick={onClose}
      aria-label={closeAriaLabel}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:text-foreground"
    >
      <X className="h-4 w-4" />
    </button>
  </div>
);
