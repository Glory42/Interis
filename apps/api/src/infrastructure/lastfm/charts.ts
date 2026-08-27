import { fetchLastfm } from "./client";

type TopArtistsResponse = {
  artists?: {
    artist?: Array<{ name?: string }>;
  };
};

// Last.fm has no global top-albums chart, only top-artists - this is the
// starting point for building a "Trending" album list from it (see
// LastfmTrendingCacheService).
export const getTopArtists = async (limit: number): Promise<string[]> => {
  const data = (await fetchLastfm({
    method: "chart.gettopartists",
    limit: String(limit),
  })) as TopArtistsResponse;

  return (data.artists?.artist ?? [])
    .map((artist) => artist.name)
    .filter((name): name is string => Boolean(name));
};

type TopAlbumsResponse = {
  topalbums?: {
    album?: Array<{ name?: string }>;
  };
};

export const getTopAlbumForArtist = async (artistName: string): Promise<string | null> => {
  const data = (await fetchLastfm({
    method: "artist.gettopalbums",
    artist: artistName,
    limit: "1",
  })) as TopAlbumsResponse;

  return data.topalbums?.album?.[0]?.name ?? null;
};
