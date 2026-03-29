import type { LucideIcon } from "lucide-react";

type ProfileTabEmptyStateProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export const ProfileTabEmptyState = ({
  title,
  description,
  icon: Icon,
}: ProfileTabEmptyStateProps) => {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 py-16 text-center">
      <Icon className="mx-auto mb-4 h-8 w-8 text-muted-foreground/70" aria-hidden="true" />
      <h3 className="mb-2 text-base font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};
