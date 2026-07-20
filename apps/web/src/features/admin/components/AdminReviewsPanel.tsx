import { useDeferredValue, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AdminConfirmDialog } from "@/features/admin/components/AdminConfirmDialog";
import type { AdminReview } from "@/features/admin/content-api";
import { useAdminReviews, useDeleteAdminReview } from "@/features/admin/hooks/useAdminContent";
import { isApiError } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/time";

const DeleteReviewAction = ({ review }: { review: AdminReview }) => {
  const { mutateAsync: deleteReview, isPending } = useDeleteAdminReview();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      await deleteReview(review.id);
      setIsOpen(false);
    } catch (submitError) {
      setError(isApiError(submitError) ? submitError.message : "Could not delete review.");
    }
  };

  return (
    <>
      <button
        type="button"
        className="text-xs text-destructive/80 hover:text-destructive"
        onClick={() => setIsOpen(true)}
      >
        Delete
      </button>
      <AdminConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Delete review"
        description={`Permanently delete @${review.authorUsername}'s review of ${review.movieTitle ?? "this title"}?`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isPending}
        error={error}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
};

export const AdminReviewsPanel = () => {
  const [usernameInput, setUsernameInput] = useState("");
  const deferredUsername = useDeferredValue(usernameInput.trim());
  const reviewsQuery = useAdminReviews({
    username: deferredUsername.length > 0 ? deferredUsername : undefined,
  });

  return (
    <div className="space-y-4">
      <Input
        value={usernameInput}
        onChange={(event) => setUsernameInput(event.target.value)}
        placeholder="Filter by username..."
        className="max-w-sm"
      />

      {reviewsQuery.isPending ? (
        <div className="flex items-center justify-center py-10">
          <Spinner />
        </div>
      ) : reviewsQuery.isError ? (
        <p className="text-sm text-muted-foreground">Could not load reviews.</p>
      ) : reviewsQuery.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews found.</p>
      ) : (
        <div className="space-y-3">
          {reviewsQuery.data.map((review) => (
            <div key={review.id} className="border border-border/60 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground">@{review.authorUsername}</span>
                  <Badge variant="muted">{review.mediaType}</Badge>
                  {review.movieTitle ? (
                    <span className="text-xs text-muted-foreground">{review.movieTitle}</span>
                  ) : null}
                  {review.containsSpoilers ? <Badge variant="accent">Spoilers</Badge> : null}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(review.createdAt.toISOString())}
                  </span>
                  <DeleteReviewAction review={review} />
                </div>
              </div>
              <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-foreground/90">
                {review.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
