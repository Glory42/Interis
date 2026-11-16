import type { MediaType } from "../constants/media-type.constant";
import { MediaFollowingRepository } from "../repositories/media-following.repository";
import type { MediaFollowingResponse } from "../types/media-following.types";

export const MEDIA_FOLLOWING_LIMIT = 50;

// "From people you follow" on a Film or Series page. An uncached title has no
// rows to find, so it resolves to an empty result without touching TMDB.
export class MediaFollowingService {
  static async forTitle(
    mediaType: MediaType,
    tmdbId: number,
    viewerUserId: string,
  ): Promise<MediaFollowingResponse> {
    const result = await MediaFollowingRepository.listForTitle(
      mediaType,
      tmdbId,
      viewerUserId,
      MEDIA_FOLLOWING_LIMIT,
    );
    return { ...result, limit: MEDIA_FOLLOWING_LIMIT };
  }
}
