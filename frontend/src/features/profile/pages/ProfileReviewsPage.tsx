import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";
import { getPosterUrl } from "@/features/films/components/utils";
import { useUserReviews } from "@/features/profile/hooks/useProfile";

type ProfileReviewsPageProps = {
  username: string;
};

const formatDate = (value: string | null): string => {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
};

export const ProfileReviewsPage = ({ username }: ProfileReviewsPageProps) => {
  const reviewsQuery = useUserReviews(username);
  const reviews = reviewsQuery.data ?? [];

  return (
    <>
      {reviewsQuery.isPending ? (
        <div className=" border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
          Loading reviews...
        </div>
      ) : null}

      {reviewsQuery.isError ? (
        <div className=" border border-border/60 bg-card/30 p-4 text-sm text-destructive">
          Could not load reviews.
        </div>
      ) : null}

      {!reviewsQuery.isPending && !reviewsQuery.isError && reviews.length === 0 ? (
        <ProfileTabEmptyState
          icon={Star}
          title="No written reviews yet"
          description="This profile has not published any reviews yet."
        />
      ) : null}

      <div className="space-y-3">
        {reviews.map((entry) => (
          <article
            key={entry.id}
            className=" border border-border/60 bg-card/30 p-3 sm:p-4"
          >
            <div className="grid gap-3 sm:grid-cols-[84px_1fr]">
              {entry.mediaType === "tv" ? (
                <Link
                  to="/serials/$tmdbId"
                  params={{ tmdbId: String(entry.tmdbId) }}
                  className="block"
                  viewTransition
                >
                  <img
                    src={getPosterUrl(entry.posterPath)}
                    alt={`${entry.title} poster`}
                    className="h-31.5 w-21  border border-border/60 object-cover"
                    loading="lazy"
                  />
                </Link>
              ) : (
                <Link
                  to="/cinema/$tmdbId"
                  params={{ tmdbId: String(entry.tmdbId) }}
                  className="block"
                  viewTransition
                >
                  <img
                    src={getPosterUrl(entry.posterPath)}
                    alt={`${entry.title} poster`}
                    className="h-31.5 w-21 border border-border/60 object-cover"
                    loading="lazy"
                  />
                </Link>
              )}

              <div className="space-y-2">
                <Link
                  to="/reviews/$username/$reviewId"
                  params={{ username, reviewId: entry.id }}
                  className="block text-sm font-semibold text-foreground hover:text-primary"
                  viewTransition
                >
                  {entry.title}
                  {entry.releaseYear ? ` (${entry.releaseYear})` : ""}
                </Link>
                <p className="text-xs text-muted-foreground">
                  Reviewed on {formatDate(entry.createdAt)}
                </p>
                {entry.containsSpoilers ? (
                  <p className="text-[10px] uppercase tracking-[0.14em] text-primary">
                    Contains spoilers
                  </p>
                ) : null}
                <Link
                  to="/reviews/$username/$reviewId"
                  params={{ username, reviewId: entry.id }}
                  className="block whitespace-pre-wrap text-sm text-foreground/95 hover:text-foreground"
                  viewTransition
                >
                  {entry.content}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
};
