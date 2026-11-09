import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { interactionKeys } from "@/features/interactions/hooks/interaction-keys";
import type { SeriesSeasonDetailResponse } from "@/features/tv/api";
import { seriesKeys } from "@/features/tv/hooks/tv/query-keys";
import type { QuerySnapshot } from "@/lib/query-optimistic";
import { isImplicitlyWatched, resolveInteraction, type InteractionState } from "./interaction-rules";
import type { MediaEvent, MediaKind } from "./media-events";
import {
  patchEpisodesInSeasonDetailCache,
  patchSeasonsInDetailViewCache,
  shiftWatchedCountsInDetailViewCache,
} from "./series-patches";

type EventOf<T extends MediaEvent["type"]> = Extract<MediaEvent, { type: T }>;
type CachedEpisode = SeriesSeasonDetailResponse["episodes"][number];

export const interactionKey = (kind: MediaKind, tmdbId: number): QueryKey =>
  kind === "film" ? interactionKeys.detail(tmdbId) : seriesKeys.interaction(tmdbId);

// Next up after episode `after`, read from the open season's episode list.
const firstUnwatchedAfter = (episodes: CachedEpisode[] | undefined, after: number) => {
  if (!episodes) return { episodeNumber: after + 1, name: `Episode ${after + 1}` };
  const next = episodes.find((episode) => episode.episodeNumber > after && !episode.viewerInteraction?.watched);
  return next ? { episodeNumber: next.episodeNumber, name: next.name } : null;
};

const cachedEpisodes = (queryClient: QueryClient, tmdbId: number, seasonNumber: number) =>
  queryClient.getQueryData<SeriesSeasonDetailResponse>(seriesKeys.seasonDetail(tmdbId, seasonNumber))?.episodes;

const patchTitleInteraction = (queryClient: QueryClient, event: EventOf<"interaction-changed">): QuerySnapshot[] => {
  const { kind, tmdbId, input } = event;
  const queryKey = interactionKey(kind, tmdbId);
  const taken: QuerySnapshot[] = [queryClient.getQueriesData({ queryKey, exact: true })];
  queryClient.setQueryData<InteractionState>(queryKey, (previous) => previous && resolveInteraction(kind, previous, input));

  // Only an explicit Series watched toggle cascades to its seasons and episodes, so they flip
  // before the TMDB-backed cascade (potentially multi-second) answers.
  if (kind === "tv" && input.watched !== undefined) {
    taken.push(
      patchSeasonsInDetailViewCache(queryClient, tmdbId, "all", { watched: input.watched }),
      patchEpisodesInSeasonDetailCache(queryClient, tmdbId, "all", { watched: input.watched }),
    );
  }
  return taken;
};

const patchSeason = (queryClient: QueryClient, event: EventOf<"season-interaction-changed">): QuerySnapshot[] => {
  const { tmdbId, seasonNumber, input } = event;
  const { watched } = input;
  if (watched === undefined) return [patchSeasonsInDetailViewCache(queryClient, tmdbId, seasonNumber, input)];
  // A season watched toggle cascades to every episode in it.
  return [
    shiftWatchedCountsInDetailViewCache(queryClient, tmdbId, seasonNumber, (current, size) =>
      watched ? (size ?? current) : 0,
    ),
    patchSeasonsInDetailViewCache(queryClient, tmdbId, seasonNumber, input),
    patchEpisodesInSeasonDetailCache(queryClient, tmdbId, seasonNumber, { watched }),
  ];
};

const patchEpisode = (queryClient: QueryClient, event: EventOf<"episode-interaction-changed">): QuerySnapshot[] => {
  const { tmdbId, seasonNumber, episodeNumber, input } = event;
  const episodes = cachedEpisodes(queryClient, tmdbId, seasonNumber);
  const wasWatched = episodes?.find((episode) => episode.episodeNumber === episodeNumber)?.viewerInteraction?.watched;
  // Liking or rating an unwatched episode marks it watched (API resolveEpisodeWatchedUpdate).
  const watched = input.watched ?? (wasWatched === false && isImplicitlyWatched(input) ? true : undefined);
  const taken: QuerySnapshot[] = [];

  if (watched !== undefined && wasWatched !== watched) {
    taken.push(
      shiftWatchedCountsInDetailViewCache(
        queryClient,
        tmdbId,
        seasonNumber,
        (current) => current + (watched ? 1 : -1),
        watched
          ? { when: (current) => current === episodeNumber, next: firstUnwatchedAfter(episodes, episodeNumber) }
          : undefined,
      ),
    );
  }
  taken.push(
    patchEpisodesInSeasonDetailCache(queryClient, tmdbId, seasonNumber, { ...input, watched }, episodeNumber),
  );

  // Ticking an episode can complete (or break) its season; mirrors syncSeasonWatchedFromEpisodes.
  const seasonEpisodes = cachedEpisodes(queryClient, tmdbId, seasonNumber);
  if (watched !== undefined && seasonEpisodes && seasonEpisodes.length > 0) {
    const allWatched = seasonEpisodes.every((episode) => episode.viewerInteraction?.watched ?? false);
    taken.push(patchSeasonsInDetailViewCache(queryClient, tmdbId, seasonNumber, { watched: allWatched }));
  }
  return taken;
};

const patchWatchedThrough = (queryClient: QueryClient, event: EventOf<"episodes-watched-through">): QuerySnapshot[] => {
  const { tmdbId, seasonNumber, episodeNumber } = event;
  const seasonDetailKey = seriesKeys.seasonDetail(tmdbId, seasonNumber);
  const episodes = cachedEpisodes(queryClient, tmdbId, seasonNumber);
  const newlyWatched = episodes?.filter(
    (episode) => episode.episodeNumber <= episodeNumber && !episode.viewerInteraction?.watched,
  ).length;
  const taken: QuerySnapshot[] = [
    shiftWatchedCountsInDetailViewCache(
      queryClient,
      tmdbId,
      seasonNumber,
      (current) => (newlyWatched === undefined ? Math.max(current, episodeNumber) : current + newlyWatched),
      { when: (current) => current <= episodeNumber, next: firstUnwatchedAfter(episodes, episodeNumber) },
    ),
    queryClient.getQueriesData({ queryKey: seasonDetailKey }),
  ];
  queryClient.setQueriesData<SeriesSeasonDetailResponse>({ queryKey: seasonDetailKey }, (old) =>
    old
      ? {
          ...old,
          episodes: old.episodes.map((episode) =>
            episode.episodeNumber <= episodeNumber
              ? {
                  ...episode,
                  viewerInteraction: {
                    liked: false,
                    rating: null,
                    hasReview: false,
                    ...episode.viewerInteraction,
                    watched: true,
                  },
                }
              : episode,
          ),
        }
      : old,
  );
  return taken;
};

// The queries an event patches, cancelled first so an in-flight fetch can't overwrite the patch.
export const optimisticTargets = (event: MediaEvent): QueryKey[] => {
  switch (event.type) {
    case "interaction-changed":
      return [
        interactionKey(event.kind, event.tmdbId),
        ...(event.kind === "tv" && event.input.watched !== undefined
          ? [seriesKeys.detailViewRoot(event.tmdbId), seriesKeys.seasonDetailRoot(event.tmdbId)]
          : []),
      ];
    case "season-interaction-changed":
    case "episode-interaction-changed":
    case "episodes-watched-through":
      return [seriesKeys.detailViewRoot(event.tmdbId), seriesKeys.seasonDetail(event.tmdbId, event.seasonNumber)];
    default:
      return [];
  }
};

// Patches the cache to what the server will save, returning each snapshot taken, oldest first.
export const patchOptimistically = (queryClient: QueryClient, event: MediaEvent): QuerySnapshot[] => {
  switch (event.type) {
    case "interaction-changed":
      return patchTitleInteraction(queryClient, event);
    case "season-interaction-changed":
      return patchSeason(queryClient, event);
    case "episode-interaction-changed":
      return patchEpisode(queryClient, event);
    case "episodes-watched-through":
      return patchWatchedThrough(queryClient, event);
    default:
      return [];
  }
};
