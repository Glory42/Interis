import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CreditRow = { key?: string; label: string; value: ReactNode };

// Film-credits layout: label, dotted leader, value. Rows without a value are left out.
export const CreditsList = ({ rows, className }: { rows: CreditRow[]; className?: string }) => (
  <dl className={cn("font-mono text-xs", className)}>
    {rows
      .filter((row) => row.value)
      .map((row) => (
        <div key={row.key ?? row.label} className="flex gap-1.5 py-[3px]">
          <dt className="shrink-0 text-muted-foreground">{row.label}</dt>
          <span aria-hidden className="flex-1 -translate-y-1 border-b border-dotted border-[color:var(--line-strong)]" />
          <dd className="min-w-0 text-right text-foreground [overflow-wrap:anywhere]">{row.value}</dd>
        </div>
      ))}
  </dl>
);
