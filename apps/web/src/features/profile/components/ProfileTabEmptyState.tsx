import { Link, type LinkProps } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

export type ProfileTabEmptyStateCta = LinkProps & {
  label: string;
};

type ProfileTabEmptyStateProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  cta?: ProfileTabEmptyStateCta;
};

export const ProfileTabEmptyState = ({
  title,
  description,
  icon: Icon,
  cta,
}: ProfileTabEmptyStateProps) => {
  return (
    <div className="rounded-xl border border-dashed border-border/70 py-16 text-center">
      <Icon className="mx-auto mb-4 h-8 w-8 text-muted-foreground/70" aria-hidden="true" />
      <h3 className="mb-2 text-base font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      {cta ? (
        <Link
          {...cta}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/45 bg-primary/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-primary transition-colors hover:bg-primary/15"
        >
          {cta.label}
        </Link>
      ) : null}
    </div>
  );
};
