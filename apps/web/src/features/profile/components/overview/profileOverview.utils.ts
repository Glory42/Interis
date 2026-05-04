import type { UserRecentActivity } from "@/features/profile/api";

export type ProfileRecentActivityItem = {
  id: string;
  tmdbId: number;
  mediaType: "movie" | "tv";
  mediaTitle: string;
  actionLabel: string;
  ratingLabel: string | null;
  createdAt: string;
};

const toFivePointRating = (ratingOutOfTen: number): number => {
  const normalized = Math.max(0, Math.min(10, ratingOutOfTen));
  return normalized / 2;
};

const formatRatingOutOfFiveLabel = (value: number): string => {
  const rounded = Math.round(value * 10) / 10;
  if (Number.isInteger(rounded)) {
    return `${rounded.toFixed(0)}/5`;
  }

  return `${rounded.toFixed(1)}/5`;
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
    if (!media || !Number.isInteger(media.tmdbId) || media.title.trim().length === 0) {
      continue;
    }

    if (media.mediaType !== "movie" && media.mediaType !== "tv") {
      continue;
    }

    if (activity.kind === "diary_entry") {
      items.push({
        id: `${activity.id}-logged`,
        tmdbId: media.tmdbId,
        mediaType: media.mediaType,
        mediaTitle: media.title,
        actionLabel: "Logged",
        ratingLabel: null,
        createdAt: activity.createdAt,
      });

      if (activity.review || activity.metadata.hasReview) {
        items.push({
          id: `${activity.id}-reviewed`,
          tmdbId: media.tmdbId,
          mediaType: media.mediaType,
          mediaTitle: media.title,
          actionLabel: "Reviewed",
          ratingLabel: null,
          createdAt: activity.createdAt,
        });
      }

      if (typeof activity.metadata.rating === "number") {
        items.push({
          id: `${activity.id}-rated`,
          tmdbId: media.tmdbId,
          mediaType: media.mediaType,
          mediaTitle: media.title,
          actionLabel: "Rated",
          ratingLabel: formatRatingOutOfFiveLabel(
            toFivePointRating(activity.metadata.rating),
          ),
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
