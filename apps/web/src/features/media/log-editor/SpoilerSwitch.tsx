import { cn } from "@/lib/utils";

type SpoilerSwitchProps = {
  checked: boolean;
  onChange: (nextValue: boolean) => void;
};

// The "Contains spoilers" switch under a review box.
export const SpoilerSwitch = ({ checked, onChange }: SpoilerSwitchProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    // Keeps the textarea focused, so the keyboard stays up while you flip it.
    onMouseDown={(event) => event.preventDefault()}
    onClick={() => onChange(!checked)}
    className={cn(
      "caption inline-flex items-center gap-2 rounded-[3px] border px-2.5 py-1.5 transition-colors",
      checked
        ? "border-[color:var(--danger)]/50 bg-[color:var(--danger)]/12 text-[color:var(--danger)]"
        : "border-[color:var(--line)] text-muted-foreground",
    )}
  >
    <span
      aria-hidden
      className={cn(
        "relative inline-block h-3 w-[22px] rounded-full bg-[color:var(--line-strong)] after:absolute after:top-0.5 after:size-2 after:rounded-full after:bg-current after:transition-[left]",
        checked ? "after:left-3" : "after:left-0.5",
      )}
    />
    Contains spoilers
  </button>
);
