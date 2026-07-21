import type { ReactNode } from "react";
import { Flag, Heart, Loader2, MessageSquare, PenSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type EngagementActionBarProps = {
  className?: string;
  children: ReactNode;
};

export const EngagementActionBar = ({ className, children }: EngagementActionBarProps) => (
  <div className={cn("flex items-center gap-6 text-xs text-muted-foreground", className)}>
    {children}
  </div>
);

type LikeButtonProps = {
  count: number;
  isLiked: boolean;
  isPending: boolean;
  disabled?: boolean;
  onToggle: () => void;
};

export const LikeButton = ({ count, isLiked, isPending, disabled, onToggle }: LikeButtonProps) => (
  <button
    type="button"
    onClick={onToggle}
    disabled={disabled || isPending}
    className={cn(
      "inline-flex items-center gap-1.5 transition-colors",
      isLiked ? "text-primary" : "hover:text-primary",
      disabled || isPending ? "cursor-not-allowed opacity-50" : "",
    )}
  >
    {isPending ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : (
      <Heart className={cn("h-4 w-4", isLiked ? "fill-current" : "")} />
    )}
    {count}
  </button>
);

type CommentButtonProps = {
  count: number;
  disabled?: boolean;
  onClick: () => void;
};

export const CommentButton = ({ count, disabled, onClick }: CommentButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="inline-flex items-center gap-1.5 transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
  >
    <MessageSquare className="h-4 w-4" />
    {count}
  </button>
);

type EditButtonProps = {
  onClick: () => void;
};

export const EditButton = ({ onClick }: EditButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
  >
    <PenSquare className="h-4 w-4" />
    Edit
  </button>
);

type ReportButtonProps = {
  onClick: () => void;
};

export const ReportButton = ({ onClick }: ReportButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className="ml-auto inline-flex items-center gap-1.5 transition-colors hover:text-destructive"
  >
    <Flag className="h-4 w-4" />
    Report
  </button>
);
