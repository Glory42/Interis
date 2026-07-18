export const DiaryRowSkeleton = () => {
  return (
    <div
      className="grid grid-cols-[1fr] items-center gap-3 border-b px-2 py-3 md:grid-cols-[80px_48px_56px_1fr_80px_120px_32px_32px_32px]"
      style={{ borderColor: "var(--profile-shell-row-border)" }}
    >
      <div className="hidden h-14 w-16 animate-pulse border border-border/40 bg-card/25 md:block" />
      <div className="hidden h-5 w-6 animate-pulse bg-border/40 md:block" />
      <div className="hidden h-14 w-10 animate-pulse border border-border/40 bg-card/25 md:block" />

      <div className="min-w-0 space-y-2">
        <div className="h-3 w-2/3 animate-pulse bg-border/40 md:hidden" />
        <div className="h-4 w-3/4 animate-pulse bg-border/40" />
        <div className="h-3 w-1/3 animate-pulse bg-border/30 md:hidden" />
      </div>

      <div className="hidden h-3 w-10 animate-pulse bg-border/30 md:block" />
      <div className="hidden h-3 w-16 animate-pulse bg-border/30 md:block" />
      <div className="hidden h-3.5 w-3.5 animate-pulse bg-border/30 md:block" />
      <div className="hidden h-3.5 w-3.5 animate-pulse bg-border/30 md:block" />
      <div className="hidden h-3.5 w-3.5 animate-pulse bg-border/30 md:block" />
    </div>
  );
};
