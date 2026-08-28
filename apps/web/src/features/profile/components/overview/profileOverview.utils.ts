import type { UserRecentActivity } from "@/features/profile/api";
import { formatRatingLabel } from "@/lib/rating";
import type { MediaType } from "@/types/api";

export type ProfileRecentActivityItem = {
  id: string;
  tmdbId: number;
  mediaType: MediaType;
  mediaTitle: string;
  posterPath: string | null;
  actionLabel: string;
  ratingLabel: string | null;
  createdAt: string;
};


const getTimestamp = (value: string): number => {
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const buildRecentActivityItems = (
  input: {
    feedItems: UserRecentActivity[];
    limit?: number;
  },
): ProfileRecentActivityItem[] => {
  const { feedItems, limit = 6 } = input;
  const items: ProfileRecentActivityItem[] = [];

  for (const activity of feedItems) {
    const media = activity.movie;
    if (!media || typeof media.tmdbId !== "number" || media.title.trim().length === 0) {
      continue;
    }

    if (media.mediaType !== "movie" && media.mediaType !== "tv") {
      continue;
    }

    const tmdbId = media.tmdbId;

    if (activity.kind === "diary_entry") {
      items.push({
        id: `${activity.id}-logged`,
        tmdbId,
        mediaType: media.mediaType,
        mediaTitle: media.title,
        posterPath: media.posterPath,
        actionLabel: "Logged",
        ratingLabel: null,
        createdAt: activity.createdAt,
      });

      if (activity.review || activity.metadata.hasReview) {
        items.push({
          id: `${activity.id}-reviewed`,
          tmdbId,
          mediaType: media.mediaType,
          mediaTitle: media.title,
          posterPath: media.posterPath,
          actionLabel: "Reviewed",
          ratingLabel: null,
          createdAt: activity.createdAt,
        });
      }

      if (typeof activity.metadata.rating === "number") {
        items.push({
          id: `${activity.id}-rated`,
          tmdbId,
          mediaType: media.mediaType,
          mediaTitle: media.title,
          posterPath: media.posterPath,
          actionLabel: "Rated",
          ratingLabel: formatRatingLabel(activity.metadata.rating),
          createdAt: activity.createdAt,
        });
      }

      continue;
    }

    items.push({
      id: activity.id,
      tmdbId: media.tmdbId,
      mediaType: media.mediaType,
      mediaTitle: media.title,
      posterPath: media.posterPath,
      actionLabel:
        activity.kind === "review"
          ? "Reviewed"
          : activity.kind === "liked_movie"
            ? "Liked"
            : activity.kind === "watchlisted_movie"
              ? "Watchlisted"
              : activity.kind === "liked_review"
                ? "Liked"
                : activity.kind === "commented"
                  ? "Commented"
                  : activity.kind === "liked_comment"
                    ? "Liked"
                    : activity.kind === "liked_post"
                      ? "Liked"
                      : activity.kind === "commented_post"
                        ? "Commented"
                        : activity.kind === "post"
                          ? "Posted"
                          : activity.kind === "followed_user"
                            ? "Followed"
                            : activity.kind === "created_list"
                              ? "Created"
                              : "Updated",
      ratingLabel: null,
      createdAt: activity.createdAt,
    });
  }

  return items
    .sort((left, right) => getTimestamp(right.createdAt) - getTimestamp(left.createdAt))
    .slice(0, limit);
};
