import { InteractionsService } from "../../interactions/interactions.service";
import { TvService } from "../../tv/tv.service";
import { ONBOARDING_TASTE_WRITE_CONCURRENCY } from "../constants/onboarding.constants";
import type { TasteItemDto } from "../dto/onboarding.dto";

type TasteKey = Pick<TasteItemDto, "mediaType" | "tmdbId">;

// Watched and rating writes record no Activity (only likes and Watchlist adds
// do), so seeding a whole grid never reaches followers' feeds.
const writeOne = async (userId: string, item: TasteItemDto): Promise<boolean> => {
  const change = item.watched
    ? { watched: true, ...(item.rating !== undefined && { rating: item.rating }) }
    : { watched: false, rating: null };
  const state =
    item.mediaType === "movie"
      ? await InteractionsService.update(userId, item.tmdbId, change)
      : await TvService.updateInteraction(userId, item.tmdbId, change);
  return state !== null;
};

export class OnboardingTasteService {
  // Every write goes through the Interaction module. One title failing (a
  // TMDB timeout on a Series' seasons) doesn't sink the rest.
  static async save(userId: string, items: TasteItemDto[]): Promise<{ saved: number; failed: TasteKey[] }> {
    const failed: TasteKey[] = [];
    let saved = 0;

    for (let start = 0; start < items.length; start += ONBOARDING_TASTE_WRITE_CONCURRENCY) {
      const chunk = items.slice(start, start + ONBOARDING_TASTE_WRITE_CONCURRENCY);
      const results = await Promise.allSettled(chunk.map((item) => writeOne(userId, item)));
      results.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value) {
          saved += 1;
          return;
        }
        const { mediaType, tmdbId } = chunk[index]!;
        failed.push({ mediaType, tmdbId });
      });
    }

    return { saved, failed };
  }
}
