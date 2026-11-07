import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { diaryKeys } from "@/features/diary/hooks/diary-keys";
import { invalidateFollowingFeed } from "@/features/feed/hooks/feed-cache";
import { feedKeys } from "@/features/feed/hooks/useFeed";
import { filmKeys } from "@/features/films/hooks/useFilms";
import { interactionKeys } from "@/features/interactions/hooks/interaction-keys";
import { profileKeys } from "@/features/profile/hooks/useProfile";
import { profileStatsKeys } from "@/features/profile/hooks/useProfileStats";
import { reviewKeys } from "@/features/reviews/hooks/review-keys";
import { seriesKeys } from "@/features/tv/hooks/tv/query-keys";
import type { MeProfile } from "@/types/api";

export type MediaKind = "film" | "tv";
export type MediaTitle = { kind: MediaKind; tmdbId: number };
export type InteractionField = "liked" | "watchlisted" | "watched" | "rating" | "watchStatus";

// Something the viewer did to a Film or Series; refreshAfter refetches whatever shows it.
export type MediaEvent =
  | (MediaTitle & { type: "log-created"; hasReview: boolean })
  | (MediaTitle & { type: "log-edited" })
  | (MediaTitle & { type: "log-deleted"; unwatch: boolean })
  | (MediaTitle & { type: "review-created" })
  | { type: "review-edited"; title: MediaTitle | null }
  | (MediaTitle & { type: "review-deleted" })
  | (MediaTitle & { type: "interaction-changed"; changed: InteractionField[] })
  | { type: "season-review-changed"; tmdbId: number; seasonNumber: number; episodeNumber: number | null };

export const toMediaKind = (mediaType: "movie" | "tv"): MediaKind => (mediaType === "movie" ? "film" : "tv");

const INTERACTION_FIELDS: InteractionField[] = ["liked", "watchlisted", "watched", "rating", "watchStatus"];

// The fields an Interaction update actually sent.
export const changedInteractionFields = (input: Partial<Record<InteractionField, unknown>>): InteractionField[] =>
  INTERACTION_FIELDS.filter((field) => input[field] !== undefined);

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

const titleKeys = ({ kind, tmdbId }: MediaTitle): QueryKey[] =>
  kind === "film"
    ? [filmKeys.detail(tmdbId), filmKeys.detailViewRoot(tmdbId), filmKeys.logs(tmdbId), interactionKeys.detail(tmdbId)]
    : [seriesKeys.detail(tmdbId), seriesKeys.detailViewRoot(tmdbId), seriesKeys.logs(tmdbId), seriesKeys.interaction(tmdbId)];

const myLogsKey = (kind: MediaKind): QueryKey => (kind === "film" ? diaryKeys.myLogs : seriesKeys.myLogs);

// The viewer's own reviews of the title, as the Log button's review chooser lists them.
const myReviewsKey = ({ kind, tmdbId }: MediaTitle): QueryKey =>
  reviewKeys.mineForTitle({ mediaType: kind === "film" ? "movie" : "tv", tmdbId });

// Everything that shows a review next to its title.
const reviewKeysFor = (title: MediaTitle): QueryKey[] => [
  (title.kind === "film" ? filmKeys : seriesKeys).detailViewRoot(title.tmdbId),
  (title.kind === "film" ? filmKeys : seriesKeys).logs(title.tmdbId),
  myLogsKey(title.kind),
  myReviewsKey(title),
];

const logKeys = (title: MediaTitle, viewer: string | null): QueryKey[] => [
  ...titleKeys(title),
  myLogsKey(title.kind),
  myReviewsKey(title),
  // A Series log marks (or a delete may unmark) its episodes watched.
  ...(title.kind === "tv" ? [seriesKeys.seasonDetailRoot(title.tmdbId)] : []),
  feedKeys.meSummary,
  ...(viewer
    ? [
        profileKeys.detail(viewer),
        profileKeys.diary(viewer),
        profileKeys.recentActivityRoot(viewer),
        profileStatsKeys.detail(viewer),
      ]
    : []),
];

const viewerKeys = (viewer: string | null, build: (username: string) => QueryKey[]) => (viewer ? build(viewer) : []);

// The queries one event changes: only this title's and this viewer's keys, never a whole namespace.
export const mediaRefreshKeys = (event: MediaEvent, viewer: string | null): QueryKey[] => {
  switch (event.type) {
    case "log-created":
      return [
        ...logKeys(event, viewer),
        ...viewerKeys(viewer, (username) => [
          // Logging takes the title off the Watchlist (#95).
          profileKeys.watchlist(username),
          ...(event.kind === "tv" ? [profileKeys.currentlyWatching(username)] : []),
          ...(event.hasReview ? [profileKeys.reviews(username)] : []),
        ]),
      ];
    case "log-edited":
      // An attached review shows the log's rating.
      return [...logKeys(event, viewer), ...viewerKeys(viewer, (username) => [profileKeys.reviews(username)])];
    case "log-deleted":
      return [
        ...logKeys(event, viewer),
        ...viewerKeys(viewer, (username) => [
          profileKeys.reviews(username),
          ...(event.kind === "tv" && event.unwatch ? [profileKeys.currentlyWatching(username)] : []),
        ]),
      ];
    case "review-created":
      return [
        ...reviewKeysFor(event),
        ...viewerKeys(viewer, (username) => [
          profileKeys.detail(username),
          profileKeys.reviews(username),
          profileKeys.recentActivityRoot(username),
        ]),
      ];
    case "review-edited":
      return [
        ...(event.title ? reviewKeysFor(event.title) : []),
        ...viewerKeys(viewer, (username) => [
          profileKeys.reviews(username),
          profileKeys.diary(username),
          profileKeys.recentActivityRoot(username),
        ]),
      ];
    case "review-deleted":
      return [
        ...reviewKeysFor(event),
        ...viewerKeys(viewer, (username) => [
          profileKeys.detail(username),
          profileKeys.reviews(username),
          profileKeys.diary(username),
          profileKeys.recentActivityRoot(username),
        ]),
      ];
    case "interaction-changed": {
      const changed = new Set(event.changed);
      const watchedChanged = changed.has("watched") || changed.has("watchStatus");
      return [
        ...titleKeys(event),
        ...(event.kind === "tv" && changed.has("watched") ? [seriesKeys.seasonDetailRoot(event.tmdbId)] : []),
        // Liking, rating or watching also takes a title off the Watchlist (#96).
        ...viewerKeys(viewer, (username) => [
          profileKeys.detail(username),
          profileStatsKeys.detail(username),
          profileKeys.watchlist(username),
          ...(changed.has("liked") ? [profileKeys.likes(username)] : []),
          ...(changed.has("liked") || changed.has("watchlisted") || changed.has("rating")
            ? [profileKeys.recentActivityRoot(username)]
            : []),
          ...(event.kind === "tv" && watchedChanged ? [profileKeys.currentlyWatching(username)] : []),
        ]),
      ];
    }
    case "season-review-changed": {
      const { tmdbId, seasonNumber, episodeNumber } = event;
      return [
        episodeNumber === null ? seriesKeys.detailViewRoot(tmdbId) : seriesKeys.seasonDetail(tmdbId, seasonNumber),
        reviewKeys.mineForTitle(
          episodeNumber === null
            ? { mediaType: "tv_season", tmdbId, seasonNumber }
            : { mediaType: "tv_episode", tmdbId, seasonNumber, episodeNumber },
        ),
        ...viewerKeys(viewer, (username) => [profileKeys.recentActivityRoot(username)]),
      ];
    }
  }
};

const viewerUsername = (queryClient: QueryClient): string | null =>
  queryClient.getQueryData<MeProfile | null>(authKeys.me)?.username ?? null;

// Every event also lands in (or changes) the Following Feed.
export const refreshAfter = async (
  queryClient: QueryClient,
  event: MediaEvent,
  viewer: string | null = viewerUsername(queryClient),
): Promise<void> => {
  await Promise.all([
    ...mediaRefreshKeys(event, viewer).map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    invalidateFollowingFeed(queryClient),
  ]);
};
