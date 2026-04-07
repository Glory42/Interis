import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";
import { getPosterUrl } from "@/features/films/components/utils";
import { useUserLikedFilms } from "@/features/profile/hooks/useProfile";
import { getRelativeTime } from "@/features/profile/utils/profile.utils";

type ProfileLikedPageProps = {
  username: string;
};

export const ProfileLikedPage = ({ username }: ProfileLikedPageProps) => {
  const likedQuery = useUserLikedFilms(username);
  const items = likedQuery.data ?? [];

  return (
    <>
      {likedQuery.isPending ? (
        <div className=" border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
          Loading liked films...
        </div>
      ) : null}

      {likedQuery.isError ? (
        <div className=" border border-border/60 bg-card/30 p-4 text-sm text-destructive">
          Could not load liked films.
        </div>
      ) : null}

      {!likedQuery.isPending && !likedQuery.isError && items.length === 0 ? (
        <ProfileTabEmptyState
          icon={Heart}
          title="No liked films yet"
          description="This profile has not liked any films yet."
        />
      ) : null}

      {!likedQuery.isPending && !likedQuery.isError && items.length > 0 ? (
        <div>
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Liked Films
          </h3>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((film) => (
              <Link
                key={`liked-${film.tmdbId}`}
                to="/cinema/$tmdbId"
                params={{ tmdbId: String(film.tmdbId) }}
                className="group block"
                viewTransition
              >
                <div className="relative mb-1.5 aspect-2/3 overflow-hidden  border border-border/70 bg-card/25">
                  <img
                    src={getPosterUrl(film.posterPath)}
                    alt={film.title}
                    className="h-full w-full object-cover opacity-90 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                    loading="lazy"
                  />
                </div>

                <p className="line-clamp-1 text-[11px] font-semibold text-foreground/95 transition-colors group-hover:text-primary">
                  {film.title}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/85">
                  {film.releaseYear ?? "Unknown year"} · liked{" "}
                  {getRelativeTime(film.lastInteractionAt)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
};
