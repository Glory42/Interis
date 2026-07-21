import { Skeleton } from "@/components/ui/Skeleton";

export const ReviewCardSkeleton = () => {
  return (
    <article
      className="border"
      style={{
        borderColor: "var(--profile-shell-border)",
        background: "var(--profile-shell-panel)",
      }}
    >
      <div className="grid gap-3 p-3 sm:p-4" style={{ gridTemplateColumns: "68px 1fr" }}>
        <Skeleton
          className="border bg-card/25"
          style={{ width: 68, height: 102, borderColor: "var(--profile-shell-row-border)" }}
        />

        <div className="min-w-0 space-y-2.5">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-2.5 w-24 bg-border/30" />
          <div className="space-y-1.5 pt-1">
            <Skeleton className="h-2.5 w-full bg-border/25" />
            <Skeleton className="h-2.5 w-5/6 bg-border/25" />
            <Skeleton className="h-2.5 w-2/3 bg-border/25" />
          </div>
        </div>
      </div>
    </article>
  );
};
