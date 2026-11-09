import type { QueryKey } from "@tanstack/react-query";
import { diaryKeys } from "@/features/diary/hooks/diary-keys";
import { feedKeys } from "@/features/feed/hooks/useFeed";
import { filmKeys } from "@/features/films/hooks/useFilms";
import { interactionKeys } from "@/features/interactions/hooks/interaction-keys";
import { profileKeys } from "@/features/profile/hooks/useProfile";
import { profileStatsKeys } from "@/features/profile/hooks/useProfileStats";
import { reviewKeys } from "@/features/reviews/hooks/review-keys";
import { seriesKeys } from "@/features/tv/hooks/tv/query-keys";
import type { MediaEvent, MediaKind, MediaTitle, SeasonInteractionInput } from "./media-events";

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

// Likes and ratings write Activity rows, so they show in recent activity.
const socialChanged = (input: SeasonInteractionInput) => input.liked !== undefined || input.rating !== undefined;

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
      const { input } = event;
      const watchedChanged = input.watched !== undefined || input.watchStatus !== undefined;
      return [
        ...titleKeys(event),
        ...(event.kind === "tv" && input.watched !== undefined ? [seriesKeys.seasonDetailRoot(event.tmdbId)] : []),
        // Liking, rating or watching also takes a title off the Watchlist (#96).
        ...viewerKeys(viewer, (username) => [
          profileKeys.detail(username),
          profileStatsKeys.detail(username),
          profileKeys.watchlist(username),
          ...(input.liked !== undefined ? [profileKeys.likes(username)] : []),
          ...(socialChanged(input) || input.watchlisted !== undefined ? [profileKeys.recentActivityRoot(username)] : []),
          ...(event.kind === "tv" && watchedChanged ? [profileKeys.currentlyWatching(username)] : []),
        ]),
      ];
    }
    case "season-interaction-changed":
    case "episode-interaction-changed":
    case "episodes-watched-through": {
      const input: SeasonInteractionInput = event.type === "episodes-watched-through" ? { watched: true } : event.input;
      // An episode's like or rating can mark it watched (or take an implicit watch back).
      const watchedChanged = input.watched !== undefined || event.type === "episode-interaction-changed";
      return [
        seriesKeys.detailViewRoot(event.tmdbId),
        seriesKeys.seasonDetail(event.tmdbId, event.seasonNumber),
        seriesKeys.interaction(event.tmdbId),
        ...viewerKeys(viewer, (username) => [
          ...(watchedChanged ? [profileKeys.currentlyWatching(username), profileStatsKeys.detail(username)] : []),
          ...(socialChanged(input) ? [profileKeys.recentActivityRoot(username)] : []),
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

