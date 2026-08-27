import { fetchLastfm } from "./client";

export type LastfmAlbumStats = {
  listeners: number;
  playcount: number;
};

type AlbumInfoResponse = {
  album?: {
    listeners?: string;
    playcount?: string;
  };
};

// Looked up by artist+album name rather than MBID - Last.fm's own mbid for
// an album frequently doesn't match MusicBrainz's release-group mbid (it
// tends to resolve to a specific release), so name lookup is the reliable
// join key here.
export const getAlbumStats = async (
  artistName: string,
  albumTitle: string,
): Promise<LastfmAlbumStats | null> => {
  const data = (await fetchLastfm({
    method: "album.getinfo",
    artist: artistName,
    album: albumTitle,
  })) as AlbumInfoResponse;

  const album = data.album;
  if (!album || album.listeners === undefined || album.playcount === undefined) {
    return null;
  }

  return {
    listeners: Number.parseInt(album.listeners, 10) || 0,
    playcount: Number.parseInt(album.playcount, 10) || 0,
  };
};
