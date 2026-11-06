import { cn } from "@/lib/utils";

// Outlined display digits for ranked lists and season numbers ("01", "02").
export const OutlinedRank = ({ value, className }: { value: number; className?: string }) => (
  <span
    className={cn(
      "font-display text-[26px] leading-none font-bold text-transparent [-webkit-text-stroke:1px_color-mix(in_srgb,var(--fg)_55%,transparent)]",
      className,
    )}
  >
    {String(value).padStart(2, "0")}
  </span>
);
