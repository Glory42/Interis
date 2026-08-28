import { useDeferredValue } from "react";
import { createPortal } from "react-dom";
import { Disc3, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useMusicSearch } from "@/features/music/hooks/useMusic";
import type { MbSearchResult } from "@/features/music/api";

type Top4AlbumSearchDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  onSelectAlbum: (result: MbSearchResult) => void;
  isSelectingAlbum: boolean;
};

const getArtistName = (result: MbSearchResult): string => {
  const credits = result["artist-credit"] ?? [];
  return credits.map((c) => c.name + (c.joinphrase ?? "")).join("").trim() || "Unknown Artist";
};

const getReleaseYear = (result: MbSearchResult): string | null => {
  const date = result["first-release-date"];
  if (!date) return null;
  return date.slice(0, 4);
};

export const Top4AlbumSearchDialog = ({
  isOpen,
  onClose,
  query,
  onQueryChange,
  onSelectAlbum,
  isSelectingAlbum,
}: Top4AlbumSearchDialogProps) => {
  const deferredQuery = useDeferredValue(query);
  const searchQuery = useMusicSearch(deferredQuery);
  const suggestions = (searchQuery.data ?? []).slice(0, 10);

  if (!isOpen) return null;

  return createPortal(
    <div className="theme-modal-overlay fixed inset-0 z-140 bg-background/70 backdrop-blur-sm">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0"
        aria-label="Close album picker"
      />

      <div className="relative mx-auto flex h-full w-full max-w-2xl items-start px-4 pt-16 sm:pt-20">
        <section
          role="dialog"
          aria-modal="true"
          className="theme-modal-panel w-full overflow-hidden border border-border/70 bg-card/95 shadow-2xl"
        >
          <div className="border-b border-border/60 p-3 sm:p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Search albums for this slot..."
                className="h-11 border-border/70 bg-background/45 pl-9 pr-11"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={onClose}
                className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:bg-secondary/55 hover:text-foreground"
                aria-label="Close picker"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[min(62dvh,30rem)] overflow-y-auto p-2 sm:p-3">
            {query.trim().length < 2 ? (
              <p className="border border-dashed border-border/70 px-3 py-4 text-sm text-muted-foreground">
                Type at least 2 characters to search.
              </p>
            ) : null}

            {query.trim().length >= 2 && searchQuery.isFetching ? (
              <p className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                <Spinner /> Finding albums...
              </p>
            ) : null}

            {query.trim().length >= 2 && !searchQuery.isFetching && suggestions.length === 0 ? (
              <p className="border border-dashed border-border/70 px-3 py-4 text-sm text-muted-foreground">
                No matches found.
              </p>
            ) : null}

            {!searchQuery.isFetching && query.trim().length >= 2 && suggestions.length > 0 ? (
              <ul className="space-y-1">
                {suggestions.map((result) => {
                  const artistName = getArtistName(result);
                  const year = getReleaseYear(result);

                  return (
                    <li key={result.id}>
                      <button
                        type="button"
                        className="grid w-full grid-cols-[42px_1fr] gap-2 border border-border/70 bg-background/30 px-2 py-2 text-left transition-colors hover:bg-secondary/45"
                        onClick={() => onSelectAlbum(result)}
                        disabled={isSelectingAlbum}
                      >
                        <div className="flex h-14 w-10 items-center justify-center bg-muted/30">
                          <Disc3 className="h-5 w-5 text-muted-foreground/50" style={{ color: "var(--module-music)" }} />
                        </div>
                        <span className="space-y-0.5">
                          <span className="line-clamp-1 block text-sm font-semibold text-foreground">
                            {result.title}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {artistName}{year ? ` · ${year}` : ""}
                          </span>
                          {result["primary-type"] ? (
                            <span className="block text-[10px] text-muted-foreground/60">
                              {result["primary-type"]}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        </section>
      </div>
    </div>,
    document.body,
  );
};
