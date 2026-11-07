import { Grid3X3, List } from "lucide-react";
import { SERIES_MODULE_STYLES } from "@/features/tv/components/series-archive/constants";
import type { ArchiveViewMode } from "@/features/tv/components/series-archive/types";

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
      className="ml-auto inline-flex items-center rounded-full border p-1"
      style={{
        borderColor: SERIES_MODULE_STYLES.border,
        background: SERIES_MODULE_STYLES.panel,
      }}
    >
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-full p-1.5"
        style={{
          color:
            viewMode === "grid"
              ? SERIES_MODULE_STYLES.accent
              : SERIES_MODULE_STYLES.faint,
          background:
            viewMode === "grid"
              ? SERIES_MODULE_STYLES.badge
              : "transparent",
        }}
        aria-label="Grid view"
        onClick={() => onSetViewMode("grid")}
      >
        <Grid3X3 className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-full p-1.5"
        style={{
          color:
            viewMode === "list"
              ? SERIES_MODULE_STYLES.accent
              : SERIES_MODULE_STYLES.faint,
          background:
            viewMode === "list"
              ? SERIES_MODULE_STYLES.badge
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
