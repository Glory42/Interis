import { Link, createFileRoute } from "@tanstack/react-router";
import { Film } from "lucide-react";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";
import { getPosterUrl } from "@/features/films/components/utils";
import { useUserFilms } from "@/features/profile/hooks/useProfile";
import { ProfileLayout } from "@/features/profile/layout/ProfileLayout";

export const Route = createFileRoute("/profile/$username/films")({
  component: ProfileFilmsPage,
});

function ProfileFilmsPage() {
  const { username } = Route.useParams();
  const filmsQuery = useUserFilms(username);

  return (
    <ProfileLayout username={username} activeTab="films">
      {filmsQuery.isPending ? (
        <div className="rounded-2xl border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
          Loading films...
        </div>
      ) : null}

      {filmsQuery.isError ? (
        <div className="rounded-2xl border border-border/60 bg-card/30 p-4 text-sm text-destructive">
          Could not load logged films.
        </div>
      ) : null}

      {!filmsQuery.isPending && !filmsQuery.isError && (filmsQuery.data?.length ?? 0) === 0 ? (
        <ProfileTabEmptyState
          icon={Film}
          title="No films logged yet"
          description="This profile has not logged any films yet."
        />
      ) : null}

      {!filmsQuery.isPending && !filmsQuery.isError && (filmsQuery.data?.length ?? 0) > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {filmsQuery.data?.map((film) => (
            <Link
              key={film.tmdbId}
              to="/films/$tmdbId"
              params={{ tmdbId: String(film.tmdbId) }}
              className="group rounded-2xl border border-border/60 bg-card/30 p-2 transition-colors hover:border-border"
              viewTransition
            >
              <img
                src={getPosterUrl(film.posterPath)}
                alt={`${film.title} poster`}
                className="h-44 w-full rounded-xl object-cover"
                loading="lazy"
              />
              <p className="mt-2 line-clamp-2 text-sm font-semibold text-foreground">
                {film.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {film.releaseYear ?? "Unknown year"}
              </p>
            </Link>
          ))}
        </div>
      ) : null}
    </ProfileLayout>
  );
}
