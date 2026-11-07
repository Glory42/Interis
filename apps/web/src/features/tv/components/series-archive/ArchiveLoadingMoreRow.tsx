import { SERIES_MODULE_STYLES } from "@/features/tv/components/series-archive/constants";
export const ArchiveLoadingMoreRow = () => {
  return (
    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`serial-archive-loading-grid-${index}`}
          className="aspect-2/3 animate-pulse rounded-lg border"
          style={{
            borderColor: SERIES_MODULE_STYLES.border,
            background: SERIES_MODULE_STYLES.panel,
          }}
        />
      ))}
    </div>
  );
};
