import type { PostMediaType } from "../posts.entity";

export type PostFeedMetadata = {
  id: string;
  content: string;
  mediaId: number | null;
  mediaType: PostMediaType | null;
};
