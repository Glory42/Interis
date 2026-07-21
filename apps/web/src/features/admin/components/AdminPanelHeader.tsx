import type { ReactNode } from "react";

type AdminPanelHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export const AdminPanelHeader = ({ title, description, action }: AdminPanelHeaderProps) => (
  <div className="flex flex-wrap items-start justify-between gap-3">
    <div>
      <h2 className="font-mono text-sm uppercase tracking-[0.14em] text-foreground">{title}</h2>
      {description ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);
