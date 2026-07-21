import { Skeleton } from "@/components/ui/Skeleton";
import type { ArchiveCardModuleStyles } from "@/features/media-archive/types";

type ArchiveSkeletonGridProps = {
  moduleStyles: Pick<ArchiveCardModuleStyles, "border" | "panel" | "borderSoft">;
};

export const ArchiveSkeletonGrid = ({ moduleStyles }: ArchiveSkeletonGridProps) => {
  return (
    <div className="grid grid-cols-2 gap-4 md:gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={`archive-skeleton-${index}`}>
          <Skeleton
            className="aspect-2/3 border"
            style={{ borderColor: moduleStyles.border, background: moduleStyles.panel }}
          />
          <Skeleton className="mt-3 h-3 w-11/12" style={{ background: moduleStyles.borderSoft }} />
          <Skeleton className="mt-1 h-2.5 w-3/4" style={{ background: moduleStyles.borderSoft }} />
        </div>
      ))}
    </div>
  );
};
