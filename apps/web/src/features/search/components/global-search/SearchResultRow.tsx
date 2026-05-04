import { ArrowRight } from "lucide-react";
import { getPosterUrl } from "@/features/films/components/utils";
import { cn } from "@/lib/utils";
import { toYear } from "./mappers";
import type { SearchResultEntry } from "./types";

type SearchResultRowProps = {
  inputId: string;
  entry: SearchResultEntry;
  index: number;
  isHighlighted: boolean;
  onHover: (index: number) => void;
  onSelect: (entry: SearchResultEntry) => void;
};

export const SearchResultRow = ({
  inputId,
  entry,
  index,
  isHighlighted,
  onHover,
  onSelect,
}: SearchResultRowProps) => {
  if (entry.kind === "users") {
    return (
      <li>
        <button
          id={`${inputId}-result-${index}`}
          type="button"
          role="option"
          aria-selected={isHighlighted}
          className={cn(
            "group flex w-full items-center gap-3 border px-3 py-2 text-left transition-all",
            isHighlighted
              ? "border-primary/45 bg-primary/10"
              : "border-border/70 bg-background/40 hover:bg-secondary/35",
          )}
          onMouseEnter={() => onHover(index)}
          onClick={() => onSelect(entry)}
        >
          {entry.avatarUrl ? (
            <img
              src={entry.avatarUrl}
              alt={`${entry.username} avatar`}
              className="h-9 w-9 shrink-0 border border-border/70 object-cover"
              loading="lazy"
            />
          ) : (
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center border font-mono text-xs"
              style={{
                borderColor: "color-mix(in srgb, var(--module-serial) 40%, transparent)",
                color: "var(--module-serial)",
                background: "rgba(0, 207, 255, 0.1)",
              }}
            >
              {entry.username.slice(0, 1).toUpperCase()}
            </span>
          )}

          <span className="min-w-0 flex-1">
            <span className="line-clamp-1 block font-mono text-[11px] font-semibold text-foreground">
              {entry.displayName}
            </span>
            <span className="block font-mono text-[10px] text-muted-foreground/85">
              @{entry.username}
            </span>
          </span>

          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/45 transition-transform group-hover:translate-x-0.5" />
        </button>
      </li>
    );
  }

  const isCinema = entry.kind === "cinema";
  const year = isCinema ? toYear(entry.releaseDate) : toYear(entry.firstAirDate);

  return (
    <li>
      <button
        id={`${inputId}-result-${index}`}
        type="button"
        role="option"
        aria-selected={isHighlighted}
        className={cn(
          "group flex w-full items-center gap-3 border px-3 py-2 text-left transition-all",
          isHighlighted
            ? "border-primary/45 bg-primary/10"
            : "border-border/70 bg-background/40 hover:bg-secondary/35",
        )}
        onMouseEnter={() => onHover(index)}
        onClick={() => onSelect(entry)}
      >
        <img
          src={getPosterUrl(entry.posterPath)}
          alt={`${entry.title} poster`}
          className="h-11 w-8 shrink-0 border border-border/70 object-cover"
          loading="lazy"
        />

        <span className="min-w-0 flex-1">
          <span className="line-clamp-1 block font-mono text-[11px] font-semibold text-foreground">
            {entry.title}
          </span>
          <span className="block font-mono text-[10px] text-muted-foreground/85">
            {isCinema ? "Cinema" : "Serials"}
            {year ? ` · ${year}` : ""}
          </span>
        </span>

        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/45 transition-transform group-hover:translate-x-0.5" />
      </button>
    </li>
  );
};
