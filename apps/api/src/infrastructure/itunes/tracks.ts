import { fetchItunes } from "./client";

export type ItunesTrackPreview = {
  previewUrl: string;
};

type ItunesSearchResponse = {
  results?: Array<{ previewUrl?: string }>;
};

// No auth token required for this endpoint. Looked up by artist+track name
// (iTunes has no MusicBrainz mbid concept), same name-join reasoning as the
// Last.fm album lookup.
export const findTrackPreview = async (
  artistName: string,
  trackTitle: string,
): Promise<ItunesTrackPreview | null> => {
  const data = (await fetchItunes({
    term: `${artistName} ${trackTitle}`,
    entity: "song",
    limit: "1",
  })) as ItunesSearchResponse;

  const previewUrl = data.results?.[0]?.previewUrl;
  return previewUrl ? { previewUrl } : null;
};
