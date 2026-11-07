import { LoadingRegion } from "@/components/ui/PageSkeletons";
import { Skeleton } from "@/components/ui/Skeleton";

export const PROFILE_MEDIA_GRID_CLASSES = "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6";

export const ProfileMediaGridSkeleton = ({ count = 12, label = "Loading titles" }: { count?: number; label?: string }) => (
  <LoadingRegion label={label} className={PROFILE_MEDIA_GRID_CLASSES}>
    {Array.from({ length: count }, (_, index) => (
      <div key={index}>
        <Skeleton shape="poster" className="rounded-[3px]" />
        <Skeleton className="mt-1.5 h-2.5 w-11/12 rounded-sm" />
        <Skeleton className="mt-1 h-2 w-3/4 rounded-sm" />
      </div>
    ))}
  </LoadingRegion>
);
