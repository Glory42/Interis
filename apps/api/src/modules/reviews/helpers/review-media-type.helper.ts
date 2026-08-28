import { MEDIA_TYPES, type MediaType } from "../../media/constants/media-type.constant";

// reviews.mediaType is a plain text column, so callers reading it back need
// to narrow it against the canonical MediaType union before it can flow
// into anything typed as ReviewMediaType.
export const toReviewMediaType = (value: string): MediaType | null =>
  (MEDIA_TYPES as readonly string[]).includes(value) ? (value as MediaType) : null;
