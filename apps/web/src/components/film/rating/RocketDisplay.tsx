import { Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

const rocketSizes = { sm: "size-3", md: "size-4", lg: "size-5" } as const;

type RocketDisplayProps = {
  rating: number | null;
  size?: keyof typeof rocketSizes;
  // row: ten rockets filled to the score. compact: one rocket and the number.
  variant?: "row" | "compact";
  className?: string;
};

const fillOf = (rating: number | null, index: number): number =>
  rating === null || Number.isNaN(rating) ? 0 : Math.max(0, Math.min(1, rating - index));

// The 1–10 rocket score (0.5 steps). Rockets, never stars.
export const RocketDisplay = ({ rating, size = "md", variant = "row", className }: RocketDisplayProps) => {
  const label = rating === null ? "Not rated" : `${rating} of 10`;

  if (variant === "compact") {
    return (
      <span aria-label={label} className={cn("inline-flex items-center gap-1 font-mono font-bold text-primary", className)}>
        <Rocket aria-hidden className={rocketSizes[size]} />
        <span aria-hidden={rating === null}>{rating === null ? "—" : rating.toFixed(1)}</span>
      </span>
    );
  }

  return (
    <span role="img" aria-label={label} className={cn("inline-flex items-center gap-0.5", className)}>
      {Array.from({ length: 10 }, (_, index) => {
        const fill = fillOf(rating, index);
        return (
          <span key={index} aria-hidden className={cn("relative inline-flex shrink-0", rocketSizes[size])}>
            <Rocket className={cn(rocketSizes[size], "fill-none text-[color:var(--line-strong)]")} />
            <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Rocket className={cn(rocketSizes[size], "fill-current text-primary")} />
            </span>
          </span>
        );
      })}
    </span>
  );
};
