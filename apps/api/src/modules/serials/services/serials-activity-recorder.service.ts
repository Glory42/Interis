import { SocialRepository, type ActivityType } from "../../social/repositories/social.repository";
import { SocialFeedService } from "../../social/services/social-feed.service";

export type SerialActivitySeriesInfo = {
  id: number;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  firstAirYear: number | null;
};

// Which part of a series an activity is about. The single discriminator
// every call site threads through instead of picking one of six
// near-identical metadata-builder functions by hand.
export type SerialActivityTarget =
  | { kind: "series" }
  | { kind: "season"; seasonNumber: number }
  | { kind: "episode"; seasonNumber: number; episodeNumber: number };

const toTargetMetadata = (target: SerialActivityTarget): Record<string, number> => {
  switch (target.kind) {
    case "series":
      return {};
    case "season":
      return { seasonNumber: target.seasonNumber };
    case "episode":
      return { seasonNumber: target.seasonNumber, episodeNumber: target.episodeNumber };
  }
};

const toSeriesMediaFields = (series: SerialActivitySeriesInfo) => ({
  seriesId: series.id,
  tmdbId: series.tmdbId,
  title: series.title,
  posterPath: series.posterPath,
  releaseYear: series.firstAirYear,
  mediaType: "tv" as const,
});

// The single entry point every serial-tracking write path uses to record an
// activity-feed row - series/season/episode likes, ratings, reviews, and
// diary entries all go through here instead of each call site separately
// deciding the metadata shape and firing its own invalidation. Callers
// still decide *whether* to record (their own previous-state comparison);
// this only owns *how*.
//
// Deliberately fire-and-forget: an activity-feed write must never block or
// fail the primary response, so record() doesn't return a promise callers
// are expected to await.
export class SerialsActivityRecorder {
  static record(input: {
    userId: string;
    series: SerialActivitySeriesInfo;
    target: SerialActivityTarget;
    type: ActivityType;
    entityId: string;
    extraMetadata?: Record<string, unknown>;
  }): void {
    const metadata = JSON.stringify({
      ...toSeriesMediaFields(input.series),
      ...toTargetMetadata(input.target),
      ...input.extraMetadata,
    });

    SocialRepository.insertActivity({
      userId: input.userId,
      type: input.type,
      entityId: input.entityId,
      metadata,
    })
      .then(() => SocialFeedService.invalidateFollowingFeed(input.userId))
      .catch(() => {});
  }
}
