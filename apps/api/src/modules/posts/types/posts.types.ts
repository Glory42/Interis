import type { MediaType } from "../../media/constants/media-type.constant";

export type PostFeedMetadata = {
  id: string;
  content: string;
  mediaId: number | null;
  mediaType: MediaType | null;
};
