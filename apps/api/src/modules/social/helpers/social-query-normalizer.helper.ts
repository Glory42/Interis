import { parseIntParam } from "../../../commons/helpers/parse-int-param.helper";
import type { FeedMediaType } from "../types/social-feed.types";

export const normalizeSocialFeedLimit = (limit: unknown, fallback = 20): number =>
  parseIntParam(limit, fallback);

export const normalizeSocialFeedMediaType = (mediaType: unknown): FeedMediaType | undefined =>
  mediaType === "movie" || mediaType === "tv" ? mediaType : undefined;
