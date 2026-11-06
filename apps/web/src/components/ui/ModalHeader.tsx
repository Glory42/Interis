import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalHeaderProps = {
  title: ReactNode;
  onClose: () => void;
  closeAriaLabel?: string;
  align?: "start" | "center";
};

// The slate bar on top of every dialog: black like film stock, mono context, close X.
export const ModalHeader = ({
  title,
  onClose,
  closeAriaLabel = "Close dialog",
  align = "center",
}: ModalHeaderProps) => (
  <div
    className={cn(
      "flex justify-between gap-2 bg-[color:var(--slate)] py-1.5 pr-1.5 pl-2.5 font-mono text-[10px] font-semibold tracking-[0.08em] text-[#8a8a8a] uppercase",
      align === "start" ? "items-start" : "items-center",
    )}
  >
    <p>{title}</p>
    <button
      type="button"
      onClick={onClose}
      aria-label={closeAriaLabel}
      className="inline-flex size-11 shrink-0 items-center justify-center text-[#bbbbbb] transition-colors hover:text-white sm:size-7"
    >
      <X className="size-3.5" />
    </button>
  </div>
);
