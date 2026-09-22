import { Link } from "@tanstack/react-router";
import type { MediaModuleStyles } from "@/features/media/styles";

type SimilarItem = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  year: number | null;
};

type MediaSimilarSectionProps = {
  heading: string;
  items: SimilarItem[] | null | undefined;
  moduleStyles: MediaModuleStyles;
  getPosterUrl: (posterPath: string | null) => string;
  detailRoute: "/movies/$tmdbId" | "/serials/$tmdbId";
};

export const MediaSimilarSection = ({
  heading,
  items,
  moduleStyles,
  getPosterUrl,
  detailRoute,
}: MediaSimilarSectionProps) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 border-t pt-8" style={{ borderColor: moduleStyles.borderSoft }}>
      <h2 className="mb-6 font-mono text-lg font-bold" style={{ color: moduleStyles.text }}>
        {heading}
      </h2>

      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6">
        {items.map((item, index) => (
          <Link
            key={`similar-${item.tmdbId}`}
            to={detailRoute}
            params={{ tmdbId: String(item.tmdbId) }}
            className="group flex flex-col gap-2 animate-fade-up"
            style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
          >
            <div
              className="relative aspect-[2/3] overflow-hidden rounded-lg border transition-transform duration-300 group-hover:scale-[1.03]"
              style={{ borderColor: moduleStyles.borderSoft }}
            >
              <img
                src={getPosterUrl(item.posterPath)}
                alt={item.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex flex-col">
              <span
                className="line-clamp-1 font-mono text-xs font-semibold group-hover:text-primary transition-colors"
                style={{ color: moduleStyles.text }}
              >
                {item.title}
              </span>
              {item.year ? (
                <span className="font-mono text-[10px]" style={{ color: moduleStyles.muted }}>
                  {item.year}
                </span>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
