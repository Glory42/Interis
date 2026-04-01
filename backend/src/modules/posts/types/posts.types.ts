export type PostFeedMetadata = {
  id: string;
  content: string;
  mediaId: number | null;
  mediaType: "movie" | "tv" | "book" | "music" | null;
};
