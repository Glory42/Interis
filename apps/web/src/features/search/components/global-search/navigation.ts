import type { SearchResultEntry } from "./types";

type NavigationHandlers = {
  openMovie: (tmdbId: number) => void;
  openSerial: (tmdbId: number) => void;
  openUser: (username: string) => void;
};

export const openSearchEntry = (
  entry: SearchResultEntry,
  handlers: NavigationHandlers,
) => {
  if (entry.kind === "users") {
    handlers.openUser(entry.username);
    return;
  }

  if (entry.kind === "movie") {
    handlers.openMovie(entry.tmdbId);
    return;
  }

  handlers.openSerial(entry.tmdbId);
};
