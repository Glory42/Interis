import { cn } from "@/lib/utils";
import { toYear } from "./mappers";
import type { SearchResultEntry } from "./types";
import { getPosterUrl } from "@/features/media/tmdb-images";

type SearchResultRowProps = {
  inputId: string;
  entry: SearchResultEntry;
  index: number;
  isHighlighted: boolean;
  onHover: (index: number) => void;
  onSelect: (entry: SearchResultEntry) => void;
};

// One result: poster or avatar, the name, and "Film · 1999 · David Fincher" / "Member · @name".
export const SearchResultRow = ({ inputId, entry, index, isHighlighted, onHover, onSelect }: SearchResultRowProps) => {
  const isUser = entry.kind === "users";
  const meta = isUser
    ? `Member · @${entry.username}`
    : [
        entry.kind === "movie" ? "Film" : "TV",
        toYear(entry.kind === "movie" ? entry.releaseDate : entry.firstAirDate),
        entry.credit,
      ]
        .filter(Boolean)
        .join(" · ");

  return (
    <li>
      <button
        id={`${inputId}-result-${index}`}
        type="button"
        role="option"
        aria-selected={isHighlighted}
        className={cn(
          "flex w-full items-center gap-3 border-l-2 px-4 py-2 text-left transition-colors",
          isHighlighted ? "border-l-[color:var(--primary)] bg-foreground/5" : "border-l-transparent hover:bg-foreground/5",
        )}
        onMouseEnter={() => onHover(index)}
        onClick={() => onSelect(entry)}
      >
        {isUser ? (
          entry.avatarUrl ? (
            <img src={entry.avatarUrl} alt="" className="size-8 shrink-0 rounded-full object-cover" loading="lazy" />
          ) : (
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
              {entry.username.slice(0, 1).toLowerCase()}
            </span>
          )
        ) : (
          <img src={getPosterUrl(entry.posterPath)} alt="" className="aspect-2/3 w-7 shrink-0 rounded-[2px] object-cover" loading="lazy" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">{isUser ? entry.displayName : entry.title}</span>
          <span
            className={cn(
              "mono-meta block truncate uppercase",
              entry.kind === "movie" ? "text-[color:var(--film)]" : entry.kind === "serials" ? "text-[color:var(--series)]" : "text-muted-foreground",
            )}
          >
            {meta}
          </span>
        </span>
      </button>
    </li>
  );
};
