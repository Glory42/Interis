import { Link, createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";
import { getPosterUrl } from "@/features/films/components/utils";
import { useUserReviews } from "@/features/profile/hooks/useProfile";
import { ProfileLayout } from "@/features/profile/layout/ProfileLayout";

export const Route = createFileRoute("/profile/$username/reviews")({
  component: ProfileReviewsPage,
});

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

function ProfileReviewsPage() {
  const { username } = Route.useParams();
  const reviewsQuery = useUserReviews(username);

  const reviews = reviewsQuery.data ?? [];

  return (
    <ProfileLayout username={username} activeTab="reviews">
      {reviewsQuery.isPending ? (
        <div className="rounded-2xl border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
          Loading reviews...
        </div>
      ) : null}

      {reviewsQuery.isError ? (
        <div className="rounded-2xl border border-border/60 bg-card/30 p-4 text-sm text-destructive">
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
            className="rounded-2xl border border-border/60 bg-card/30 p-3 sm:p-4"
          >
            <div className="grid gap-3 sm:grid-cols-[84px_1fr]">
              <Link
                to="/films/$tmdbId"
                params={{ tmdbId: String(entry.tmdbId) }}
                className="block"
                viewTransition
              >
                <img
                  src={getPosterUrl(entry.posterPath)}
                  alt={`${entry.title} poster`}
                  className="h-[126px] w-[84px] rounded-lg border border-border/60 object-cover"
                  loading="lazy"
                />
              </Link>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  {entry.title}
                  {entry.releaseYear ? ` (${entry.releaseYear})` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  Reviewed on {formatDate(entry.createdAt)}
                </p>
                {entry.containsSpoilers ? (
                  <p className="text-[10px] uppercase tracking-[0.14em] text-primary">
                    Contains spoilers
                  </p>
                ) : null}
                <p className="whitespace-pre-wrap text-sm text-foreground/95">
                  {entry.content}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </ProfileLayout>
  );
}
