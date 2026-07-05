import { Link } from "@tanstack/react-router";
import type { MovieDetailResponse } from "@/features/films/api";
import { CINEMA_MODULE_STYLES } from "@/features/films/components/cinema-detail/styles";
import { getPosterUrl } from "@/features/films/components/utils";

type CinemaSimilarSectionProps = {
  similar: MovieDetailResponse["similar"];
};

export const CinemaSimilarSection = ({ similar }: CinemaSimilarSectionProps) => {
  if (!similar || similar.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 border-t pt-8" style={{ borderColor: CINEMA_MODULE_STYLES.borderSoft }}>
      <h2 className="mb-6 font-mono text-lg font-bold" style={{ color: CINEMA_MODULE_STYLES.text }}>
        Similar Films
      </h2>

      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6">
        {similar.map((movie) => (
          <Link
            key={`similar-${movie.tmdbId}`}
            to="/cinema/$tmdbId"
            params={{ tmdbId: String(movie.tmdbId) }}
            className="group flex flex-col gap-2"
          >
            <div
              className="relative aspect-[2/3] overflow-hidden border transition-all duration-300 group-hover:scale-[1.03]"
              style={{ borderColor: CINEMA_MODULE_STYLES.borderSoft }}
            >
              <img
                src={getPosterUrl(movie.posterPath)}
                alt={movie.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex flex-col">
              <span
                className="line-clamp-1 font-mono text-xs font-semibold group-hover:text-primary transition-colors"
                style={{ color: CINEMA_MODULE_STYLES.text }}
              >
                {movie.title}
              </span>
              {movie.releaseYear ? (
                <span className="font-mono text-[10px]" style={{ color: CINEMA_MODULE_STYLES.muted }}>
                  {movie.releaseYear}
                </span>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
