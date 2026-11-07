import { cn } from "@/lib/utils";

type ReelCellsProps = {
  total: number;
  watched: number;
  tone?: "film" | "series";
  className?: string;
};

// Long seasons (anime runs of 300+) get thinner cells so the strip stays a glance.
const DENSE_FROM = 100;

// One small cell per episode, filled for each watched one.
export const ReelCells = ({ total, watched, tone = "series", className }: ReelCellsProps) => (
  <div
    role="img"
    aria-label={`${watched} of ${total} episodes watched`}
    className={cn("flex flex-wrap", total >= DENSE_FROM ? "gap-px" : "gap-0.5", className)}
  >
    {Array.from({ length: total }, (_, index) => (
      <i
        key={index}
        className={cn(
          total >= DENSE_FROM ? "h-2 w-[3px]" : "h-2.5 w-[7px] rounded-[1px]",
          index < watched
            ? tone === "film"
              ? "bg-[color:var(--film)]"
              : "bg-[color:var(--series)]"
            : "bg-foreground/12",
        )}
      />
    ))}
  </div>
);
