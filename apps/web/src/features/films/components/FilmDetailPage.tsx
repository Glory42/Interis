import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Award } from "lucide-react";
import { type FilmDetailReviewSort } from "@/features/films/api";
import { FilmDetailsMainSection } from "@/features/films/components/film-detail/FilmDetailsMainSection";
import { FilmReviewsSection } from "@/features/films/components/film-detail/FilmReviewsSection";
import { FILM_MODULE_STYLES } from "@/features/media/styles";
import { useFilmDetailView } from "@/features/films/hooks/useFilms";
import { LetterboxHero } from "@/features/media/detail/LetterboxHero";
import { MediaDetailActionCard } from "@/features/media/detail/MediaDetailActionCard";
import { MediaDetailFallback } from "@/features/media/detail/MediaDetailFallback";
import { isValidTmdbId, useMediaDetail } from "@/features/media/detail/use-media-detail";
import { BELOW_MD_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { MediaSimilarSection } from "@/features/media/detail/MediaSimilarSection";
import { MediaActionsSidebar } from "@/features/media/detail/MediaActionsSidebar";
import { getBackdropUrl, getPosterUrl } from "@/features/media/tmdb-images";
import { toLanguageLabel } from "@/features/media/labels";

type FilmDetailPageProps = {
  tmdbId: number;
};

export function FilmDetailPage({ tmdbId }: FilmDetailPageProps) {
  const isValidId = isValidTmdbId(tmdbId);
  const [reviewsSort, setReviewsSort] =
    useState<FilmDetailReviewSort>("popular");

  const detailQuery = useFilmDetailView(tmdbId, reviewsSort, isValidId);
  const mediaDetail = useMediaDetail("film", tmdbId, detailQuery.data?.userRating);
  const isBelowMd = useMediaQuery(BELOW_MD_QUERY);

  if (!isValidId || detailQuery.isError || !detailQuery.data) {
    return <MediaDetailFallback kind="film" isValidId={isValidId} isPending={detailQuery.isPending} />;
  }

  const detail = detailQuery.data;
  const movie = detail.movie;
  const backdropUrl = movie.backdropPath
    ? getBackdropUrl(movie.backdropPath)
    : null;

  const actionCard = (
    <MediaDetailActionCard
      media={{
        kind: "film",
        tmdbId: movie.tmdbId,
        title: movie.title,
        year: movie.releaseYear,
        posterPath: movie.posterPath,
      }}
      userRating={detail.userRating}
      moduleStyles={FILM_MODULE_STYLES}
      state={mediaDetail}
    />
  );

  return (
    <div className="min-h-screen">
      <LetterboxHero
        backdropUrl={backdropUrl}
        slateLeft={[
          "Interis",
          "Film",
          ...(movie.releaseYear ? [String(movie.releaseYear)] : []),
        ]}
        slateRight={[
          toLanguageLabel(movie.languageCode),
          movie.productionCountries[0] ?? null,
        ].filter((part): part is string => Boolean(part))}
      />

      <main className="relative z-10 mx-auto -mt-20 w-full max-w-5xl px-4 pb-10 sm:-mt-28">
        <Link
          to="/movies"
          className="mb-4 inline-flex items-center gap-1.5 font-mono text-[11px]"
          style={{ color: FILM_MODULE_STYLES.muted }}
          viewTransition
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Films</span>
        </Link>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-[220px_1fr]">
          <MediaActionsSidebar
            moduleStyles={FILM_MODULE_STYLES}
            posterSlot={
              movie.posterPath ? (
                <img
                  src={getPosterUrl(movie.posterPath)}
                  alt={`${movie.title} poster`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full flex-col items-center justify-center gap-2"
                  style={{ background: FILM_MODULE_STYLES.panelSoft }}
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center"
                    style={{ background: FILM_MODULE_STYLES.panelStrong }}
                  >
                    <Award
                      className="h-4 w-4"
                      style={{ color: FILM_MODULE_STYLES.accent }}
                    />
                  </div>
                  <span
                    className="font-mono text-[8px] uppercase tracking-[0.22em]"
                    style={{ color: FILM_MODULE_STYLES.faint }}
                  >
                    No Art
                  </span>
                </div>
              )
            }
          >
            {isBelowMd ? null : actionCard}
          </MediaActionsSidebar>

          <FilmDetailsMainSection detail={detail} actionsSlot={isBelowMd ? actionCard : null} />
        </div>

        <FilmReviewsSection
          key={reviewsSort}
          tmdbId={tmdbId}
          reviewsSort={reviewsSort}
          onSortChange={setReviewsSort}
          reviews={detail.reviews}
          reviewsLimit={detail.reviewsLimit}
          reviewsHasMore={detail.reviewsHasMore}
        />

        <MediaSimilarSection
          heading="Similar Movies"
          items={detail.similar.map((item) => ({
            ...item,
            year: item.releaseYear,
          }))}
          moduleStyles={FILM_MODULE_STYLES}
          getPosterUrl={getPosterUrl}
          detailRoute="/movies/$tmdbId"
        />
      </main>
    </div>
  );
}
