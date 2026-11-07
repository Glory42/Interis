import { MediaInteractions } from "../media-interactions.repository";
import { YourRatingRepository } from "../repositories/your-rating.repository";
import { WatchLogStores } from "../../media/repositories/watch-log.repository";
import type { MediaType } from "../../media/constants/media-type.constant";
import type { LatestRatedLog } from "../../media/types/watch-log.types";

const SIDES = {
  movie: { logs: WatchLogStores.film, interactions: MediaInteractions.forMovie() },
  tv: { logs: WatchLogStores.series, interactions: MediaInteractions.forSeries() },
} as const;

// The one owner of Your Rating: the Interaction rating, else the latest
// rated Diary Entry. Reads resolve it; log writes keep the stored one in step.
export class YourRatingService {
  static async resolve(mediaType: MediaType, userId: string, mediaId: number) {
    return YourRatingRepository.resolve(mediaType, userId, mediaId);
  }

  // Community Rating source: every user's Your Rating, one each.
  static async communityRatings(mediaType: MediaType, mediaId: number) {
    return YourRatingRepository.communityRatings(mediaType, mediaId);
  }

  static async latestRatedLog(mediaType: MediaType, userId: string, mediaId: number) {
    return SIDES[mediaType].logs.findLatestRated(userId, mediaId);
  }

  // Writing the latest rated log's rating or date sets the rating (#91). When the
  // latest rated log changes otherwise, a rating still matching the old one follows.
  static async followLatestRatedLog(
    mediaType: MediaType,
    userId: string,
    mediaId: number,
    change: { before: LatestRatedLog | null; writtenLogId?: string | null },
  ): Promise<void> {
    const { logs, interactions } = SIDES[mediaType];
    const after = await logs.findLatestRated(userId, mediaId);
    if (!after) return;

    if (after.id === change.writtenLogId) {
      await interactions.setRating(userId, mediaId, after.rating);
      return;
    }

    const { before } = change;
    if (!before || (before.id === after.id && before.rating === after.rating)) return;

    const current = await interactions.find(userId, mediaId);
    if (current?.rating === before.rating) {
      await interactions.setRating(userId, mediaId, after.rating);
    }
  }
}
