import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type SkeletonProps = {
  className?: string;
  style?: CSSProperties;
};

export const Skeleton = ({ className, style }: SkeletonProps) => (
  <div className={cn("animate-pulse bg-border/40", className)} style={style} aria-hidden="true" />
);
