export const ProfileReviewDetailPending = () => {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12">
      <div className="h-64 animate-pulse border border-border/60 bg-card/35" />
    </div>
  );
};

export const ProfileReviewDetailError = () => {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="border border-destructive/45 bg-destructive/10 p-5 text-sm text-destructive">
        Could not load this review.
      </div>
    </div>
  );
};
