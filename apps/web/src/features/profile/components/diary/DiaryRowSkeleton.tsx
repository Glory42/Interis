import { Skeleton } from "@/components/ui/Skeleton";

// Mirrors DiaryRow: day column, small poster, title and kicker, then the rockets.
export const DiaryRowSkeleton = () => (
  <div className="flex items-center gap-3 border-b border-[color:var(--line)] py-2.5">
    <div className="flex w-9 shrink-0 flex-col items-center gap-1 sm:w-11">
      <Skeleton className="h-5 w-6 rounded-sm" />
      <Skeleton className="h-2 w-5 rounded-sm" />
    </div>
    <Skeleton shape="poster" className="w-10 shrink-0 rounded-[2px]" />
    <div className="min-w-0 flex-1 space-y-1.5">
      <Skeleton className="h-3.5 w-1/2 rounded-sm" />
      <Skeleton className="h-2 w-16 rounded-sm" />
    </div>
    <Skeleton className="hidden h-3 w-28 rounded-sm sm:block" />
    <Skeleton className="h-3 w-10 rounded-sm sm:hidden" />
  </div>
);
