import type { FilmDetailResponse, FilmDetailReviewSort } from "@/features/films/api";
import { FILM_MODULE_STYLES } from "@/features/media/styles";
import { useFilmReviewsLoadMore } from "@/features/films/hooks/useFilms";
import { MediaReviewsSection } from "@/features/media/detail/MediaReviewsSection";

type FilmReviewsSectionProps = {
  tmdbId: number;
  reviewsSort: FilmDetailReviewSort;
  onSortChange: (nextSort: FilmDetailReviewSort) => void;
  reviews: FilmDetailResponse["reviews"];
  reviewsLimit: number;
  reviewsHasMore: boolean;
};

export const FilmReviewsSection = ({
  tmdbId,
  reviewsSort,
  onSortChange,
  reviews,
  reviewsLimit,
  reviewsHasMore,
}: FilmReviewsSectionProps) => {
  const { extraItems, loadMore, isLoading, hasMore } = useFilmReviewsLoadMore(
    tmdbId,
    reviewsSort,
    reviewsLimit,
    reviewsHasMore,
  );

  return (
    <MediaReviewsSection
      moduleStyles={FILM_MODULE_STYLES}
      emptyMessage="No reviews yet for this movie."
      reviewsSort={reviewsSort}
      onSortChange={onSortChange}
      reviews={reviews}
      extraItems={extraItems}
      isLoadingMore={isLoading}
      hasMore={hasMore}
      onLoadMore={() => void loadMore()}
    />
  );
};
