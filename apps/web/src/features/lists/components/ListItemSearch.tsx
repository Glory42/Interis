import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import { searchMovies } from "@/features/films/api/requests";
import { searchSeries } from "@/features/serials/api/requests";
import type { TmdbSearchMovie } from "@/types/api";
import type { TmdbSearchSeries } from "@/features/serials/api/types";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const getPosterUrl = (path: string | null) =>
  path ? `${TMDB_IMAGE_BASE}/w92${path}` : "";

export type SearchResult = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
  itemType: "cinema" | "serial";
};

const normalizeSeries = (s: TmdbSearchSeries): SearchResult => ({
  tmdbId: s.id,
  title: s.name,
  posterPath: s.poster_path,
  releaseYear: s.first_air_date ? parseInt(s.first_air_date.slice(0, 4)) : null,
  itemType: "serial",
});

const normalizeMovie = (m: TmdbSearchMovie): SearchResult => ({
  tmdbId: m.id,
  title: m.title,
  posterPath: m.poster_path,
  releaseYear: m.release_date ? parseInt(m.release_date.slice(0, 4)) : null,
  itemType: "cinema",
});

type ListItemSearchProps = {
  existingTmdbIds: Set<string>;
  onSelect: (result: SearchResult) => void;
};

export const ListItemSearch = ({ existingTmdbIds, onSelect }: ListItemSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const moviesQuery = useQuery({
    queryKey: ["listFormSearch", "movies", debouncedQuery],
    queryFn: ({ signal }) => searchMovies(debouncedQuery, { signal }),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 30_000,
  });

  const seriesQuery = useQuery({
    queryKey: ["listFormSearch", "series", debouncedQuery],
    queryFn: ({ signal }) => searchSeries(debouncedQuery, { signal }),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 30_000,
  });

  const isSearchPending =
    debouncedQuery.trim().length >= 2 &&
    (moviesQuery.isPending || seriesQuery.isPending);

  const searchResults: SearchResult[] = [
    ...(moviesQuery.data?.map(normalizeMovie) ?? []),
    ...(seriesQuery.data?.map(normalizeSeries) ?? []),
  ].slice(0, 10);

  const handleSelect = (result: SearchResult) => {
    setShowDropdown(false);
    setSearchQuery("");
    onSelect(result);
  };

  return (
    <div className="mb-4 border-t border-border/50 pt-6">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        Add films &amp; series
      </p>
      <div className="relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search by title..."
            className="w-full rounded-lg border border-border/75 bg-background/45 py-2 pl-9 pr-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          {isSearchPending ? (
            <Spinner className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
          ) : null}
        </div>

        {showDropdown && debouncedQuery.trim().length >= 2 && !isSearchPending ? (
          <div className="absolute left-0 right-0 top-full z-50 overflow-hidden rounded-b-lg border border-t-0 border-border/80 bg-card shadow-lg">
            {searchResults.length === 0 ? (
              <p className="px-4 py-3 font-mono text-xs text-muted-foreground">
                No results found.
              </p>
            ) : (
              <ul>
                {searchResults.map((result) => {
                  const key = `${result.itemType}:${result.tmdbId}`;
                  const alreadyAdded = existingTmdbIds.has(key);
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => handleSelect(result)}
                        className="flex w-full items-center gap-3 border-b border-border/30 px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-muted/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div className="h-10 w-7 shrink-0 overflow-hidden rounded-md border border-border/30 bg-muted/20">
                          {result.posterPath ? (
                            <img
                              src={getPosterUrl(result.posterPath)}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-mono text-sm text-foreground">
                            {result.title}
                          </p>
                          {result.releaseYear ? (
                            <p className="font-mono text-[10px] text-muted-foreground">
                              {result.releaseYear}
                            </p>
                          ) : null}
                        </div>
                        <span className="shrink-0 rounded-full border border-border/50 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
                          {result.itemType === "cinema" ? "Film" : "Series"}
                        </span>
                        {alreadyAdded ? (
                          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                            Added
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
