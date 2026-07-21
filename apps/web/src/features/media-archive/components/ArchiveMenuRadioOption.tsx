import type { ReactNode } from "react";
import type { ArchiveCardModuleStyles } from "@/features/media-archive/types";

type ArchiveMenuRadioOptionProps = {
  isSelected: boolean;
  onSelect: () => void;
  children: ReactNode;
  moduleStyles: Pick<ArchiveCardModuleStyles, "accent" | "muted" | "badge">;
};

export const ArchiveMenuRadioOption = ({
  isSelected,
  onSelect,
  children,
  moduleStyles,
}: ArchiveMenuRadioOptionProps) => {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={isSelected}
      className="w-full px-4 py-2 text-left font-mono text-[10px] transition-colors"
      style={{
        color: isSelected ? moduleStyles.accent : moduleStyles.muted,
        background: isSelected ? moduleStyles.badge : "transparent",
      }}
      onClick={onSelect}
    >
      {children}
    </button>
  );
};
