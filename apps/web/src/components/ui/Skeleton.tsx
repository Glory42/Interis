import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

// Shape presets match the real content they stand in for.
const shapeClasses = {
  block: "",
  line: "h-3 w-full rounded-sm",
  title: "h-5 w-2/3 rounded-sm",
  poster: "aspect-[2/3] w-full rounded-sm",
  backdrop: "aspect-video w-full rounded-sm",
  avatar: "size-10 rounded-full",
} as const;

type SkeletonProps = {
  shape?: keyof typeof shapeClasses;
  className?: string;
  style?: CSSProperties;
};

export const Skeleton = ({ shape = "block", className, style }: SkeletonProps) => (
  <div
    className={cn("animate-pulse bg-foreground/8", shapeClasses[shape], className)}
    style={style}
    aria-hidden="true"
  />
);
