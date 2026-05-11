import type { ReactNode } from "react";
import { BOOK_MODULE_STYLES } from "@/features/books/components/books-archive/constants";

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
        color: isSelected ? BOOK_MODULE_STYLES.accent : BOOK_MODULE_STYLES.muted,
        background: isSelected ? BOOK_MODULE_STYLES.badge : "transparent",
      }}
      onClick={onSelect}
    >
      {children}
    </button>
  );
};
