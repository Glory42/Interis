import type { UpdateSeriesInteractionInput } from "@/features/tv/api";

export type MediaKind = "film" | "tv";
export type MediaTitle = { kind: MediaKind; tmdbId: number };

// One Interaction write, as the Film or Series PUT sends it (watchStatus is Series-only).
export type InteractionInput = {
  liked?: boolean;
  watchlisted?: boolean;
  rating?: number | null;
  watched?: boolean;
  watchStatus?: UpdateSeriesInteractionInput["watchStatus"];
};

// A season- or episode-level Interaction write.
export type SeasonInteractionInput = { watched?: boolean; liked?: boolean; rating?: number | null };

// Something the viewer did to a Film or Series; the media cache patches and refetches whatever shows it.
export type MediaEvent =
  | (MediaTitle & { type: "log-created"; hasReview: boolean })
  | (MediaTitle & { type: "log-edited" })
  | (MediaTitle & { type: "log-deleted"; unwatch: boolean })
  | (MediaTitle & { type: "review-created" })
  | { type: "review-edited"; title: MediaTitle | null }
  | (MediaTitle & { type: "review-deleted" })
  | (MediaTitle & { type: "interaction-changed"; input: InteractionInput })
  | { type: "season-interaction-changed"; tmdbId: number; seasonNumber: number; input: SeasonInteractionInput }
  | {
      type: "episode-interaction-changed";
      tmdbId: number;
      seasonNumber: number;
      episodeNumber: number;
      input: SeasonInteractionInput;
    }
  | { type: "episodes-watched-through"; tmdbId: number; seasonNumber: number; episodeNumber: number }
  | { type: "season-review-changed"; tmdbId: number; seasonNumber: number; episodeNumber: number | null };

export const toMediaKind = (mediaType: "movie" | "tv"): MediaKind => (mediaType === "movie" ? "film" : "tv");

// The event a saved review's edit fires, read from its wire media fields.
export const reviewEditedEvent = (review: { mediaType?: string; mediaSourceId?: string }): MediaEvent => {
  const [tmdbId = 0, seasonNumber = -1, episodeNumber = -1] = (review.mediaSourceId ?? "").split(":").map(Number);
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) return { type: "review-edited", title: null };
  if (review.mediaType === "movie" || review.mediaType === "tv") {
    return { type: "review-edited", title: { kind: toMediaKind(review.mediaType), tmdbId } };
  }
  if (review.mediaType === "tv_season" && seasonNumber >= 0) {
    return { type: "season-review-changed", tmdbId, seasonNumber, episodeNumber: null };
  }
  if (review.mediaType === "tv_episode" && seasonNumber >= 0 && episodeNumber >= 0) {
    return { type: "season-review-changed", tmdbId, seasonNumber, episodeNumber };
  }
  return { type: "review-edited", title: null };
};
