import {
  type ArchiveSortTab,
  CINEMA_MODULE_STYLES,
  sortOptions,
} from "@/features/films/components/cinema-archive/constants";

type ArchiveSortControlsProps = {
  activeSort: ArchiveSortTab;
  archiveCountLabel: string;
  onSetSort: (nextSort: ArchiveSortTab) => void;
};

export const ArchiveSortControls = ({
  activeSort,
  archiveCountLabel,
  onSetSort,
}: ArchiveSortControlsProps) => {
  return (
    <div
      className="mb-8 flex flex-wrap items-center gap-3 border-b pb-4 sm:gap-4"
      style={{ borderColor: CINEMA_MODULE_STYLES.border }}
    >
      <span
        className="font-mono text-[10px] uppercase tracking-[0.22em]"
        style={{ color: CINEMA_MODULE_STYLES.faint }}
      >
        Sort:
      </span>

      <div className="flex flex-wrap gap-2">
        {sortOptions.map((option) => {
          const isActive = activeSort === option.id;

          return (
            <button
              key={option.id}
              type="button"
              className="border px-3 py-1.5 font-mono text-[10px] transition-all"
              style={{
                borderColor: isActive
                  ? CINEMA_MODULE_STYLES.accent
                  : CINEMA_MODULE_STYLES.borderSoft,
                color: isActive
                  ? CINEMA_MODULE_STYLES.accent
                  : CINEMA_MODULE_STYLES.faint,
                background: isActive
                  ? "color-mix(in srgb, var(--module-cinema) 8%, transparent)"
                  : "transparent",
              }}
              onClick={() => {
                onSetSort(option.id);
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <span
        className="ml-auto font-mono text-[10px]"
        style={{ color: CINEMA_MODULE_STYLES.faint }}
      >
        {archiveCountLabel}
      </span>
    </div>
  );
};
