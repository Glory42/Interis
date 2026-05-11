import { MUSIC_MODULE_STYLES } from "@/features/music/components/music-archive/constants";

export const ArchiveSkeletonGrid = () => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
    {Array.from({ length: 12 }).map((_, index) => (
      <div key={`music-archive-skeleton-${index}`}>
        <div
          className="aspect-square animate-pulse border"
          style={{
            borderColor: MUSIC_MODULE_STYLES.border,
            background: MUSIC_MODULE_STYLES.panel,
          }}
        />
        <div
          className="mt-3 h-3 w-11/12 animate-pulse"
          style={{ background: MUSIC_MODULE_STYLES.borderSoft }}
        />
        <div
          className="mt-1 h-2.5 w-3/4 animate-pulse"
          style={{ background: MUSIC_MODULE_STYLES.borderSoft }}
        />
      </div>
    ))}
  </div>
);
