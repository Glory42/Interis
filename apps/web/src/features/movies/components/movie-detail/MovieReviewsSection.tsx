import type { MovieDetailResponse, MovieDetailReviewSort } from "@/features/movies/api";
import { MOVIE_MODULE_STYLES } from "@/features/media/styles";
import { useMovieReviewsLoadMore } from "@/features/movies/hooks/useMovies";
import { MediaReviewsSection } from "@/features/media/detail/MediaReviewsSection";

type MovieReviewsSectionProps = {
  tmdbId: number;
  reviewsSort: MovieDetailReviewSort;
  onSortChange: (nextSort: MovieDetailReviewSort) => void;
  reviews: MovieDetailResponse["reviews"];
  reviewsLimit: number;
  reviewsHasMore: boolean;
};

export const MovieReviewsSection = ({
  tmdbId,
  reviewsSort,
  onSortChange,
  reviews,
  reviewsLimit,
  reviewsHasMore,
}: MovieReviewsSectionProps) => {
  const { extraItems, loadMore, isLoading, hasMore } = useMovieReviewsLoadMore(
    tmdbId,
    reviewsSort,
    reviewsLimit,
    reviewsHasMore,
  );

  return (
    <MediaReviewsSection
      moduleStyles={MOVIE_MODULE_STYLES}
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
