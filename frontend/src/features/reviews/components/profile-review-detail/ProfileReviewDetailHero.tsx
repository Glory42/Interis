import { Link } from "@tanstack/react-router";
import { ArrowLeft, Film, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type ReviewDetail } from "@/features/reviews/api";
import { SpaceRatingDisplay } from "@/features/films/components/SpaceRating";
import { getPosterUrl } from "@/features/films/components/utils";
import { formatRelativeTime } from "@/features/reviews/components/profile-review-detail/utils";

type ProfileReviewDetailHeroProps = {
  username: string;
  detail: ReviewDetail;
  displayAuthorName: string;
  authorAvatar: string | null;
  mediaCreditParts: string[];
  ratingLabel: string | null;
};

export const ProfileReviewDetailHero = ({
  username,
  detail,
  displayAuthorName,
  authorAvatar,
  mediaCreditParts,
  ratingLabel,
}: ProfileReviewDetailHeroProps) => {
  const heroImageUrl = getPosterUrl(detail.media.posterPath);

  return (
    <section className="theme-hero-shell relative h-104 overflow-hidden sm:h-112">
      <img
        src={heroImageUrl}
        alt={`${detail.media.title} artwork`}
        className="theme-hero-media h-full w-full scale-[1.03] object-cover opacity-25 blur-[1px]"
      />
      <div className="theme-hero-gradient-layer absolute inset-0" />
      <div className="theme-hero-pattern-layer absolute inset-0" />
      <div className="theme-hero-readable-overlay absolute inset-y-0 left-0 w-[74%] bg-linear-to-r from-background/78 via-background/34 to-transparent" />
      <div className="theme-hero-readable-overlay absolute inset-x-0 bottom-0 h-[54%] bg-linear-to-t from-background/74 via-background/26 to-transparent" />

      <div className="absolute left-0 right-0 top-6 z-22 mx-auto w-full max-w-7xl px-4">
        <Button asChild variant="outline" size="sm" className="bg-background/45 backdrop-blur-sm">
          <Link to="/profile/$username/reviews" params={{ username }} viewTransition>
            <ArrowLeft className="h-4 w-4" /> Back to reviews
          </Link>
        </Button>
      </div>

      <div className="theme-hero-safe-area mx-auto w-full max-w-7xl px-4">
        <div className="theme-hero-safe-content flex w-full items-end gap-6">
          <div className="-mb-4 hidden shrink-0 sm:block">
            {detail.mediaType === "tv" ? (
              <Link to="/serials/$tmdbId" params={{ tmdbId: String(detail.media.tmdbId) }}>
                <div className="h-40 w-28 overflow-hidden border border-border/60 shadow-2xl">
                  <img
                    src={getPosterUrl(detail.media.posterPath)}
                    alt={`${detail.media.title} poster`}
                    className="h-full w-full object-cover"
                  />
                </div>
              </Link>
            ) : (
              <Link to="/cinema/$tmdbId" params={{ tmdbId: String(detail.media.tmdbId) }}>
                <div className="h-40 w-28 overflow-hidden border border-border/60 shadow-2xl">
                  <img
                    src={getPosterUrl(detail.media.posterPath)}
                    alt={`${detail.media.title} poster`}
                    className="h-full w-full object-cover"
                  />
                </div>
              </Link>
            )}
          </div>

          <div className="flex-1 pb-1">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px]">
              {detail.mediaType === "tv" ? (
                <Tv className="h-3 w-3 text-primary" />
              ) : (
                <Film className="h-3 w-3 text-primary" />
              )}
              <span className="theme-kicker font-bold uppercase tracking-[0.16em] text-primary">
                {detail.mediaType === "tv" ? "Series Review" : "Film Review"}
              </span>
              {detail.containsSpoilers ? (
                <span className="border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-amber-200">
                  Spoilers
                </span>
              ) : null}
              {detail.media.genres.length > 0 ? (
                <span className="bg-secondary/75 px-2 py-0.5 text-muted-foreground">
                  {detail.media.genres
                    .slice(0, 2)
                    .map((genre) => genre.name)
                    .join(" / ")}
                </span>
              ) : null}
            </div>

            <h1 className="theme-display-title text-4xl font-black leading-none tracking-tight text-foreground">
              {detail.media.title}
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              {mediaCreditParts.length > 0
                ? mediaCreditParts.join(" · ")
                : "No additional credits available"}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                {authorAvatar ? (
                  <img
                    src={authorAvatar}
                    alt={`${detail.author.username} avatar`}
                    className="h-8 w-8 border border-border/70 object-cover"
                  />
                ) : (
                  <span className="inline-flex h-8 w-8 items-center justify-center border border-border/70 bg-secondary text-[10px] font-semibold text-secondary-foreground">
                    {detail.author.username.slice(0, 1).toUpperCase()}
                  </span>
                )}

                <p className="text-xs text-muted-foreground">
                  by{" "}
                  <Link
                    to="/profile/$username"
                    params={{ username: detail.author.username }}
                    className="font-semibold text-foreground hover:text-primary"
                    viewTransition
                  >
                    {displayAuthorName}
                  </Link>{" "}
                  · {formatRelativeTime(detail.createdAt)}
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 border border-border/70 bg-secondary/40 px-2.5 py-1 text-xs font-semibold text-foreground">
                <SpaceRatingDisplay ratingOutOfFive={detail.ratingOutOfFive} size="sm" />
                <span>{ratingLabel ?? "Unrated"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
