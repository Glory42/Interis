export const PROFILE_MEDIA_GRID_CLASSES = "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6";

export const ProfileMediaGridSkeleton = ({ count = 12 }: { count?: number }) => {
  return (
    <div className={PROFILE_MEDIA_GRID_CLASSES}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={`profile-media-skeleton-${index}`}>
          <div className="aspect-2/3 animate-pulse border border-border/70 bg-card/25" />
          <div className="mt-1.5 h-2.5 w-11/12 animate-pulse bg-border/40" />
          <div className="mt-1 h-2 w-3/4 animate-pulse bg-border/30" />
        </div>
      ))}
    </div>
  );
};
