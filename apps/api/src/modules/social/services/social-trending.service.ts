import { SocialTrendingRepository } from "../repositories/social-trending.repository";
import { rankTrendingTitles, type TrendingSignal } from "../helpers/social-trending.helper";

const TRENDING_WINDOW_DAYS = 7;
export const DEFAULT_TRENDING_LIMIT = 6;

// Every media-scoped activity is written via ActivityRecorder.recordMedia,
// which always embeds tmdbId/title/mediaType/posterPath/releaseYear into
// metadata (see buildSubjectMetadata) - so trending can resolve a signal
// straight from the activity row's own metadata, no join back to
// movies/tvSeries needed.
type ActivityMediaMetadata = {
  tmdbId?: number;
  title?: string;
  mediaType?: "movie" | "tv";
  posterPath?: string | null;
  releaseYear?: number | null;
};

const parseMediaMetadata = (raw: string | null): ActivityMediaMetadata | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ActivityMediaMetadata;
  } catch {
    return null;
  }
};

export class SocialTrendingService {
  static async getTrending(limit: number = DEFAULT_TRENDING_LIMIT) {
    const since = new Date(Date.now() - TRENDING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const rows = await SocialTrendingRepository.getTrendingActivityRows(since);

    const signals: TrendingSignal[] = [];
    for (const row of rows) {
      const metadata = parseMediaMetadata(row.metadata);
      if (!metadata || typeof metadata.tmdbId !== "number" || !metadata.title) {
        continue;
      }

      signals.push({
        userId: row.userId,
        mediaType: metadata.mediaType === "tv" ? "tv" : "movie",
        tmdbId: metadata.tmdbId,
        title: metadata.title,
        posterPath: metadata.posterPath ?? null,
        releaseYear: metadata.releaseYear ?? null,
        createdAt: row.createdAt,
      });
    }

    return { items: rankTrendingTitles(signals, limit) };
  }
}
