import { Link } from "@tanstack/react-router";
import { Film } from "lucide-react";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";
import { getPosterUrl } from "@/features/films/components/utils";
import { useUserFilms } from "@/features/profile/hooks/useProfile";

type ProfileCinemaPageProps = {
  username: string;
};

export const ProfileCinemaPage = ({ username }: ProfileCinemaPageProps) => {
  const cinemaQuery = useUserFilms(username);

  return (
    <>
      {cinemaQuery.isPending ? (
        <div className=" border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
          Loading cinema...
        </div>
      ) : null}

      {cinemaQuery.isError ? (
        <div className=" border border-border/60 bg-card/30 p-4 text-sm text-destructive">
          Could not load logged cinema.
        </div>
      ) : null}

      {!cinemaQuery.isPending &&
      !cinemaQuery.isError &&
      (cinemaQuery.data?.length ?? 0) === 0 ? (
        <ProfileTabEmptyState
          icon={Film}
          title="No cinema logged yet"
          description="This profile has not logged any cinema yet."
        />
      ) : null}

      {!cinemaQuery.isPending &&
      !cinemaQuery.isError &&
      (cinemaQuery.data?.length ?? 0) > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {cinemaQuery.data?.map((film) => (
            <Link
              key={film.tmdbId}
              to="/cinema/$tmdbId"
              params={{ tmdbId: String(film.tmdbId) }}
              className="group  border border-border/60 bg-card/30 p-2 transition-colors hover:border-border"
              viewTransition
            >
              <img
                src={getPosterUrl(film.posterPath)}
                alt={`${film.title} poster`}
                className="h-44 w-full  object-cover"
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
    </>
  );
};
