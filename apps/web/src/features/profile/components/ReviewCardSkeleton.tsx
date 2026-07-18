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
        <div
          className="animate-pulse border bg-card/25"
          style={{ width: 68, height: 102, borderColor: "var(--profile-shell-row-border)" }}
        />

        <div className="min-w-0 space-y-2.5">
          <div className="h-4 w-2/3 animate-pulse bg-border/40" />
          <div className="h-2.5 w-24 animate-pulse bg-border/30" />
          <div className="space-y-1.5 pt-1">
            <div className="h-2.5 w-full animate-pulse bg-border/25" />
            <div className="h-2.5 w-5/6 animate-pulse bg-border/25" />
            <div className="h-2.5 w-2/3 animate-pulse bg-border/25" />
          </div>
        </div>
      </div>
    </article>
  );
};
