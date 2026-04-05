import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
  {
    variants: {
      variant: {
        default: "border-border bg-secondary/40 text-secondary-foreground",
        accent: "border-accent/35 bg-accent/12 text-accent",
        primary: "border-primary/35 bg-primary/12 text-primary",
        muted: "border-border/70 bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export const Badge = ({ className, variant, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ variant }), className)} {...props} />
);
