import type { SearchResultEntry } from "./types";

type NavigationHandlers = {
  openCinema: (tmdbId: number) => void;
  openSerial: (tmdbId: number) => void;
  openUser: (username: string) => void;
  openMusic: (mbid: string) => void;
  openBook: (volumeId: string) => void;
};

export const openSearchEntry = (
  entry: SearchResultEntry,
  handlers: NavigationHandlers,
) => {
  if (entry.kind === "users") {
    handlers.openUser(entry.username);
    return;
  }

  if (entry.kind === "cinema") {
    handlers.openCinema(entry.tmdbId);
    return;
  }

  if (entry.kind === "serials") {
    handlers.openSerial(entry.tmdbId);
    return;
  }

  if (entry.kind === "music") {
    handlers.openMusic(entry.mbid);
    return;
  }

  handlers.openBook(entry.volumeId);
};
