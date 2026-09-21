import type { LucideIcon } from "lucide-react";
import type { MediaModuleStyles } from "@/features/media/styles";

export type MediaFactRow = {
  label: string;
  value: string;
  icon: LucideIcon;
};

type MediaFactsGridProps = {
  factRows: MediaFactRow[];
  moduleStyles: MediaModuleStyles;
};

export const MediaFactsGrid = ({ factRows, moduleStyles }: MediaFactsGridProps) => {
  return (
    <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
      {factRows.map((fact) => (
        <div
          key={fact.label}
          className="flex items-start gap-3 border-b py-3"
          style={{ borderColor: moduleStyles.borderSoft }}
        >
          <fact.icon
            className="mt-0.5 h-3.5 w-3.5 shrink-0"
            style={{ color: moduleStyles.accent }}
          />
          <div className="min-w-0 flex-1">
            <p
              className="mb-0.5 font-mono text-[9px] uppercase tracking-[0.22em]"
              style={{ color: moduleStyles.faint }}
            >
              {fact.label}
            </p>
            <p className="font-mono text-xs" style={{ color: moduleStyles.text }}>
              {fact.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
