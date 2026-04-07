import type { ReactNode } from "react";
import { SERIAL_MODULE_STYLES } from "@/features/serials/components/serial-archive/constants";

type ArchiveMenuRadioOptionProps = {
  isSelected: boolean;
  onSelect: () => void;
  children: ReactNode;
};

export const ArchiveMenuRadioOption = ({
  isSelected,
  onSelect,
  children,
}: ArchiveMenuRadioOptionProps) => {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={isSelected}
      className="w-full px-4 py-2 text-left font-mono text-[10px] transition-colors"
      style={{
        color: isSelected ? SERIAL_MODULE_STYLES.accent : SERIAL_MODULE_STYLES.muted,
        background: isSelected ? SERIAL_MODULE_STYLES.badge : "transparent",
      }}
      onClick={onSelect}
    >
      {children}
    </button>
  );
};
