import { getSeriesSeasonDetails as tmdbGetSeasonDetails } from "../../../infrastructure/tmdb/serials";
import type { SerialSeasonEpisodeReviewRow } from "../repositories/serials-season-episode-reviews.repository";
import type { SerialDetailReviewItem } from "../types/serials.types";

type SeriesReviewRow = {
  id: string;
  content: string;
  containsSpoilers: boolean;
  createdAt: Date;
  updatedAt: Date;
  watchedDate: string | null;
  rating: number | null;
  userId: string;
  authorUsername: string;
  authorDisplayUsername: string | null;
  authorAvatarUrl: string | null;
};

export const resolveSeriesReviewItems = (
  reviewRows: SeriesReviewRow[],
  likeCountByReviewId: Map<string, number>,
  viewerLikedReviewIds: Set<string>,
): SerialDetailReviewItem[] =>
  reviewRows.map((reviewRow) => ({
    id: reviewRow.id,
    content: reviewRow.content,
    containsSpoilers: reviewRow.containsSpoilers,
    createdAt: reviewRow.createdAt,
    updatedAt: reviewRow.updatedAt,
    watchedDate: reviewRow.watchedDate,
    rating: reviewRow.rating,
    likeCount: likeCountByReviewId.get(reviewRow.id) ?? 0,
    viewerHasLiked: viewerLikedReviewIds.has(reviewRow.id),
    author: {
      id: reviewRow.userId,
      username: reviewRow.authorUsername,
      displayUsername: reviewRow.authorDisplayUsername,
      avatarUrl: reviewRow.authorAvatarUrl,
    },
    context: null,
  }));

// Builds the season/episode review items for a series detail response,
// resolving each episode review's episode name via one cached TMDB
// season-detail fetch per distinct season referenced (not per review).
export const resolveSeasonEpisodeReviewItems = async (
  tmdbId: number,
  seasonEpisodeReviewRows: SerialSeasonEpisodeReviewRow[],
  likeCountByReviewId: Map<string, number>,
  viewerLikedReviewIds: Set<string>,
): Promise<SerialDetailReviewItem[]> => {
  const distinctEpisodeReviewSeasons = [
    ...new Set(
      seasonEpisodeReviewRows
        .filter((row) => row.episodeNumber !== null)
        .map((row) => row.seasonNumber),
    ),
  ];
  const episodeReviewSeasonDetails = await Promise.all(
    distinctEpisodeReviewSeasons.map((seasonNumber) =>
      tmdbGetSeasonDetails(tmdbId, seasonNumber).catch(() => null),
    ),
  );
  const episodeNameBySeasonAndEpisode = new Map<string, string>();
  distinctEpisodeReviewSeasons.forEach((seasonNumber, index) => {
    for (const episode of episodeReviewSeasonDetails[index]?.episodes ?? []) {
      episodeNameBySeasonAndEpisode.set(
        `${seasonNumber}:${episode.episode_number}`,
        episode.name || `Episode ${episode.episode_number}`,
      );
    }
  });

  return seasonEpisodeReviewRows.map((row) => ({
    id: row.id,
    content: row.content,
    containsSpoilers: row.containsSpoilers,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    watchedDate: null,
    rating: row.rating,
    likeCount: likeCountByReviewId.get(row.id) ?? 0,
    viewerHasLiked: viewerLikedReviewIds.has(row.id),
    author: {
      id: row.userId,
      username: row.authorUsername,
      displayUsername: row.authorDisplayUsername,
      avatarUrl: row.authorAvatarUrl,
    },
    context: {
      seasonNumber: row.seasonNumber,
      episodeNumber: row.episodeNumber,
      episodeName:
        row.episodeNumber !== null
          ? (episodeNameBySeasonAndEpisode.get(`${row.seasonNumber}:${row.episodeNumber}`) ?? null)
          : null,
    },
  }));
};
