import { useDeferredValue, useState } from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminConfirmDialog } from "@/features/admin/components/AdminConfirmDialog";
import { AdminPanelHeader } from "@/features/admin/components/AdminPanelHeader";
import { AdminPanelState } from "@/features/admin/components/AdminPanelState";
import { AdminSearchInput } from "@/features/admin/components/AdminSearchInput";
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
      <Button
        type="button"
        variant="ghost"
        size="sm"
        title="Delete"
        aria-label="Delete"
        className="h-7 w-7 p-0 text-destructive/80 hover:text-destructive"
        onClick={() => setIsOpen(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
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
      <AdminPanelHeader
        title="Reviews"
        description="Moderate written reviews across the archive."
        action={
          <AdminSearchInput
            value={usernameInput}
            onChange={(event) => setUsernameInput(event.target.value)}
            placeholder="Filter by username..."
          />
        }
      />

      <AdminPanelState
        query={reviewsQuery}
        emptyMessage="No reviews found."
        errorMessage="Could not load reviews."
      >
        {(reviews) => (
          <div className="space-y-3">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">@{review.authorUsername}</span>
                      <Badge variant="muted">{review.mediaType}</Badge>
                      {review.movieTitle ? (
                        <span className="text-xs text-muted-foreground">{review.movieTitle}</span>
                      ) : null}
                      {review.containsSpoilers ? <Badge variant="accent">Spoilers</Badge> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(review.createdAt.toISOString())}
                      </span>
                      <DeleteReviewAction review={review} />
                    </div>
                  </div>
                  <p className="line-clamp-3 whitespace-pre-wrap text-sm text-foreground/90">
                    {review.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </AdminPanelState>
    </div>
  );
};
