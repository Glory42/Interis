import { Grid3X3, List } from "lucide-react";
import { SERIAL_MODULE_STYLES } from "@/features/serials/components/serial-archive/constants";
import type { ArchiveViewMode } from "@/features/serials/components/serial-archive/types";

type ArchiveViewModeToggleProps = {
  viewMode: ArchiveViewMode;
  onSetViewMode: (mode: ArchiveViewMode) => void;
};

export const ArchiveViewModeToggle = ({
  viewMode,
  onSetViewMode,
}: ArchiveViewModeToggleProps) => {
  return (
    <div
      className="ml-auto inline-flex items-center border p-1"
      style={{
        borderColor: SERIAL_MODULE_STYLES.border,
        background: SERIAL_MODULE_STYLES.panel,
      }}
    >
      <button
        type="button"
        className="inline-flex items-center justify-center p-1.5"
        style={{
          color:
            viewMode === "grid"
              ? SERIAL_MODULE_STYLES.accent
              : SERIAL_MODULE_STYLES.faint,
          background:
            viewMode === "grid"
              ? SERIAL_MODULE_STYLES.badge
              : "transparent",
        }}
        aria-label="Grid view"
        onClick={() => onSetViewMode("grid")}
      >
        <Grid3X3 className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className="inline-flex items-center justify-center p-1.5"
        style={{
          color:
            viewMode === "list"
              ? SERIAL_MODULE_STYLES.accent
              : SERIAL_MODULE_STYLES.faint,
          background:
            viewMode === "list"
              ? SERIAL_MODULE_STYLES.badge
              : "transparent",
        }}
        aria-label="List view"
        onClick={() => onSetViewMode("list")}
      >
        <List className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
