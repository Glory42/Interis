import { DocumentSkeleton, LineRowsSkeleton } from "@/components/ui/PageSkeletons";

export const ProfileReviewDetailPending = () => {
  return (
    <DocumentSkeleton label="Loading review">
      <LineRowsSkeleton count={3} />
    </DocumentSkeleton>
  );
};

export const ProfileReviewDetailError = () => {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="rounded-lg border border-destructive/45 bg-destructive/10 p-5 text-sm text-destructive">
        Could not load this review.
      </div>
    </div>
  );
};
