import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckboxProps = {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

// Square 14px box; the whole row is the hit target.
export const Checkbox = ({ label, checked, onCheckedChange, disabled, className }: CheckboxProps) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onCheckedChange(!checked)}
    className={cn(
      "inline-flex min-h-11 items-center gap-2 text-sm text-foreground disabled:opacity-40 sm:min-h-0",
      className,
    )}
  >
    <span
      aria-hidden
      className={cn(
        "inline-grid size-3.5 place-items-center rounded-sm border border-[color:var(--line-strong)]",
        checked && "border-primary bg-primary text-primary-foreground",
      )}
    >
      {checked ? <Check className="size-2.5" strokeWidth={3} /> : null}
    </span>
    {label}
  </button>
);
