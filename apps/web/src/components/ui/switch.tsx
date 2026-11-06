import { cn } from "@/lib/utils";

type SwitchProps = {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

// Squared track and thumb, per components.html.
export const Switch = ({ label, checked, onCheckedChange, disabled, className }: SwitchProps) => (
  <button
    type="button"
    role="switch"
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
        "relative h-4 w-7 rounded-sm border border-[color:var(--line-strong)] transition-colors",
        checked && "border-primary bg-primary/20",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 size-2.5 rounded-[1px] bg-muted-foreground transition-transform",
          checked && "translate-x-3 bg-primary",
        )}
      />
    </span>
    {label}
  </button>
);
