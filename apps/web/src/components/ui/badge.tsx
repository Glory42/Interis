import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Mono, 2px corners, an outline in the tone's own colour.
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm border border-current px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em]",
  {
    variants: {
      variant: {
        neutral: "text-muted-foreground",
        default: "text-muted-foreground",
        muted: "text-muted-foreground",
        primary: "text-primary",
        film: "text-[color:var(--film)]",
        accent: "text-[color:var(--film)]",
        series: "text-[color:var(--series)]",
        like: "text-[color:var(--like)]",
        danger: "text-[color:var(--danger)]",
        warning: "text-[color:var(--warning)]",
        success: "text-[color:var(--success)]",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export const Badge = ({ className, variant, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ variant }), className)} {...props} />
);
