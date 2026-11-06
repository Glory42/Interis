import { cn } from "@/lib/utils";

type SegmentedTone = "primary" | "film" | "series";

type SegmentedProps<T extends string> = {
  ariaLabel: string;
  options: { value: T; label: string }[];
  value: T;
  onValueChange: (value: T) => void;
  // The active segment takes the module colour (film or TV) where it applies.
  tone?: SegmentedTone;
  className?: string;
};

const toneVar: Record<SegmentedTone, string> = {
  primary: "var(--primary)",
  film: "var(--film)",
  series: "var(--series)",
};

export const Segmented = <T extends string>({
  ariaLabel,
  options,
  value,
  onValueChange,
  tone = "primary",
  className,
}: SegmentedProps<T>) => (
  <div
    role="radiogroup"
    aria-label={ariaLabel}
    className={cn(
      "inline-flex overflow-hidden rounded-md border border-[color:var(--line-strong)]",
      className,
    )}
    style={{ "--segment-tone": toneVar[tone] } as React.CSSProperties}
  >
    {options.map((option, index) => {
      const isActive = option.value === value;
      return (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={isActive}
          onClick={() => onValueChange(option.value)}
          className={cn(
            "min-h-11 px-3 py-1.5 font-mono text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase transition-colors sm:min-h-0",
            index > 0 && "border-l border-[color:var(--line)]",
            isActive &&
              "bg-[color-mix(in_srgb,var(--segment-tone)_14%,transparent)] text-foreground shadow-[inset_0_-2px_var(--segment-tone)]",
          )}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);
