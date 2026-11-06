import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StateAction = { label: string; onClick: () => void };

type EmptyStateProps = {
  title: string;
  icon?: LucideIcon;
  // Visitors see what's empty; the owner also gets the way to fill it.
  viewer?: "owner" | "visitor";
  description?: ReactNode;
  ownerDescription?: ReactNode;
  ownerAction?: StateAction;
  className?: string;
};

export const EmptyState = ({
  title,
  icon: Icon,
  viewer = "visitor",
  description,
  ownerDescription,
  ownerAction,
  className,
}: EmptyStateProps) => {
  const isOwner = viewer === "owner";
  const body = isOwner ? (ownerDescription ?? description) : description;

  return (
    <div className={cn("flex flex-col items-center gap-2 border border-dashed border-[color:var(--line-strong)] px-6 py-10 text-center", className)}>
      {Icon ? <Icon aria-hidden className="size-5 text-muted-foreground" /> : null}
      <p className="display-4 text-foreground">{title}</p>
      {body ? <p className="body-s max-w-sm text-muted-foreground">{body}</p> : null}
      {isOwner && ownerAction ? (
        <Button variant="secondary" className="mt-2" onClick={ownerAction.onClick}>
          {ownerAction.label}
        </Button>
      ) : null}
    </div>
  );
};

type ErrorStateProps = {
  title: string;
  detail?: string | null;
  onRetry?: () => void;
  className?: string;
};

export const ErrorState = ({ title, detail, onRetry, className }: ErrorStateProps) => (
  <div
    role="alert"
    className={cn("flex flex-col items-start gap-2 border border-destructive/40 px-4 py-3 text-sm shadow-[inset_2px_0_var(--danger)]", className)}
  >
    <p className="font-semibold text-foreground">{title}</p>
    {detail ? <p className="body-s text-muted-foreground">{detail}</p> : null}
    {onRetry ? (
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Try again
      </Button>
    ) : null}
  </div>
);
