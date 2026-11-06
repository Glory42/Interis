import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChipProps = {
  children: ReactNode;
  onRemove?: () => void;
  // Accessible name of the remove button when children isn't plain text.
  removeLabel?: string;
  className?: string;
};

export const Chip = ({ children, onRemove, removeLabel, className }: ChipProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-md border border-[color:var(--line-strong)] px-2 py-1 text-[11.5px] text-foreground",
      className,
    )}
  >
    {children}
    {onRemove ? (
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel ?? `Remove ${typeof children === "string" ? children : "filter"}`}
        className="-mr-0.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-3" />
      </button>
    ) : null}
  </span>
);
