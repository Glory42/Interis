import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { BookDetailReviewSort } from "@/features/books/api";
import { BookActionsSidebar } from "@/features/books/components/books-detail/BookActionsSidebar";
import { BookDetailsMainSection } from "@/features/books/components/books-detail/BookDetailsMainSection";
import { BookDetailTopBar } from "@/features/books/components/books-detail/BookDetailTopBar";
import { BookReviewsSection } from "@/features/books/components/books-detail/BookReviewsSection";
import { BOOK_MODULE_STYLES } from "@/features/books/components/books-detail/styles";
import { LogBookModal } from "@/features/books/components/LogBookModal";
import {
  useBookDetailView,
  useBookInteraction,
  useUpdateBookInteraction,
} from "@/features/books/hooks/useBooks";

type BookDetailPageProps = {
  volumeId: string;
};

const BookDetailStatusPanel = ({
  message,
  loading = false,
}: {
  message: string;
  loading?: boolean;
}) => {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      {loading ? (
        <div
          className="h-64 animate-pulse border"
          style={{
            borderColor: BOOK_MODULE_STYLES.border,
            background: BOOK_MODULE_STYLES.panel,
          }}
        />
      ) : (
        <div
          className="border p-5 font-mono text-xs"
          style={{
            borderColor: BOOK_MODULE_STYLES.border,
            background: BOOK_MODULE_STYLES.panel,
            color: BOOK_MODULE_STYLES.muted,
          }}
        >
          {message}
        </div>
      )}
    </main>
  );
};

export const BookDetailPage = ({ volumeId }: BookDetailPageProps) => {
  const [reviewsSort, setReviewsSort] = useState<BookDetailReviewSort>("popular");
  const [isLogOpen, setIsLogOpen] = useState(false);

  const detailQuery = useBookDetailView(volumeId, reviewsSort, volumeId.length > 0);
  const { user } = useAuth();
  const interactionQuery = useBookInteraction(volumeId, Boolean(user) && volumeId.length > 0);
  const updateInteractionMutation = useUpdateBookInteraction(volumeId);

  if (!volumeId) {
    return <BookDetailStatusPanel message="Invalid book id." />;
  }

  if (detailQuery.isPending) {
    return <BookDetailStatusPanel message="Loading..." loading />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return <BookDetailStatusPanel message="Could not load this book right now." />;
  }

  const detail = detailQuery.data;
  const book = detail.book;

  const wantToRead = interactionQuery.data?.wantToRead ?? false;
  const liked = interactionQuery.data?.liked ?? false;
  const interactionRatingOutOfFive = interactionQuery.data?.ratingOutOfFive ?? null;
  const currentRatingOutOfFive =
    interactionRatingOutOfFive ?? detail.userLog?.ratingOutOfFive ?? null;
  const isInteractionBusy =
    interactionQuery.isPending || updateInteractionMutation.isPending;

  return (
    <div className="min-h-screen">
      <BookDetailTopBar title={book.title} />

      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[220px_1fr]">
          <BookActionsSidebar
            detail={detail}
            currentRatingOutOfFive={currentRatingOutOfFive}
            isRatingSaving={updateInteractionMutation.isPending}
            onRatingChange={(nextRating) => {
              if (!user || nextRating === currentRatingOutOfFive) return;
              void updateInteractionMutation.mutateAsync({ ratingOutOfFive: nextRating });
            }}
            isAuthenticated={Boolean(user)}
            wantToRead={wantToRead}
            liked={liked}
            isInteractionBusy={isInteractionBusy}
            onToggleWantToRead={() => {
              void updateInteractionMutation.mutateAsync({ wantToRead: !wantToRead });
            }}
            onToggleLike={() => {
              void updateInteractionMutation.mutateAsync({ liked: !liked });
            }}
            onOpenLog={() => setIsLogOpen(true)}
          />

          <LogBookModal
            volumeId={volumeId}
            bookTitle={book.title}
            publishedYear={book.publishedYear ?? null}
            coverImageUrl={book.coverImageUrl ?? null}
            isOpen={isLogOpen}
            onClose={() => setIsLogOpen(false)}
          />

          <BookDetailsMainSection detail={detail} />
        </div>

        <BookReviewsSection
          reviewsSort={reviewsSort}
          onSortChange={setReviewsSort}
          reviews={detail.reviews}
        />
      </main>
    </div>
  );
};
