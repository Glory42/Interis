import { Skeleton } from "@/components/ui/Skeleton";

export const DiaryRowSkeleton = () => {
  return (
    <div
      className="grid grid-cols-[1fr] items-center gap-3 border-b px-2 py-3 md:grid-cols-[80px_48px_56px_1fr_80px_120px_32px_32px_32px]"
      style={{ borderColor: "var(--profile-shell-row-border)" }}
    >
      <Skeleton className="hidden h-14 w-16 border border-border/40 bg-card/25 md:block" />
      <Skeleton className="hidden h-5 w-6 md:block" />
      <Skeleton className="hidden h-14 w-10 border border-border/40 bg-card/25 md:block" />

      <div className="min-w-0 space-y-2">
        <Skeleton className="h-3 w-2/3 md:hidden" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3 bg-border/30 md:hidden" />
      </div>

      <Skeleton className="hidden h-3 w-10 bg-border/30 md:block" />
      <Skeleton className="hidden h-3 w-16 bg-border/30 md:block" />
      <Skeleton className="hidden h-3.5 w-3.5 bg-border/30 md:block" />
      <Skeleton className="hidden h-3.5 w-3.5 bg-border/30 md:block" />
      <Skeleton className="hidden h-3.5 w-3.5 bg-border/30 md:block" />
    </div>
  );
};
