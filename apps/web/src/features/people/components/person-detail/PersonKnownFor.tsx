import { Link } from "@tanstack/react-router";
import { OutlinedRank } from "@/components/film/OutlinedRank";
import type { PersonCreditItem } from "@/features/people/api";
import { getPosterUrl } from "@/features/media/tmdb-images";

// Their most-voted titles, ranked with outlined numbers.
export const PersonKnownFor = ({ credits }: { credits: PersonCreditItem[] }) => {
  if (credits.length === 0) return null;
  return (
    <section aria-label="Known for">
      <p className="kicker mb-2 text-muted-foreground">Known for · most voted on TMDB</p>
      <ol className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
        {credits.map((credit, index) => (
          <li key={`${credit.mediaType}-${credit.tmdbId}`} className="relative">
            <Link
              to={credit.mediaType === "tv" ? "/serials/$tmdbId" : "/movies/$tmdbId"}
              params={{ tmdbId: String(credit.tmdbId) }}
              className="block"
              viewTransition
            >
              <OutlinedRank value={index + 1} className="absolute -top-2 -left-1 z-10 text-2xl" />
              <img src={getPosterUrl(credit.posterPath)} alt="" className="aspect-2/3 w-full rounded-[2px] border border-[color:var(--line)] object-cover" loading="lazy" />
              <span className="mt-1 block truncate text-xs font-semibold text-foreground">{credit.title}</span>
              {credit.releaseYear ? <span className="mono-meta text-muted-foreground">{credit.releaseYear}</span> : null}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
};
