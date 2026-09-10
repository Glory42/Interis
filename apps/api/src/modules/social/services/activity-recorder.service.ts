import { toMediaFields } from "../../../commons/helpers/media-activity-fields.helper";
import { SocialRepository, type ActivityType } from "../repositories/social.repository";
import { SocialFeedService } from "./social-feed.service";

// The one entry point for writing an activity-feed row. Every write path -
// diary entries, reviews, likes, watchlist toggles, follows, lists, posts,
// and the serial season/episode variants - goes through here instead of
// each call site separately calling SocialRepository.insertActivity and
// then remembering to invalidate the following-feed cache. Owning the
// invalidation here is the point: it stopped leaking into ~15 call sites.

export type MovieActivityInfo = {
  id: number;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
};

export type SeriesActivityInfo = {
  id: number;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  firstAirYear: number | null;
};

// Which media - and for a series, which nesting level - an activity is
// about. The single discriminator every media write path threads through,
// replacing the two sibling recorder classes and their six near-identical
// metadata builders.
export type ActivitySubject =
  | { kind: "movie"; movie: MovieActivityInfo }
  | { kind: "series"; series: SeriesActivityInfo }
  | { kind: "season"; series: SeriesActivityInfo; seasonNumber: number }
  | {
      kind: "episode";
      series: SeriesActivityInfo;
      seasonNumber: number;
      episodeNumber: number;
    };

const buildSubjectMetadata = (subject: ActivitySubject): Record<string, unknown> => {
  if (subject.kind === "movie") {
    return {
      movieId: subject.movie.id,
      mediaType: "movie" as const,
      ...toMediaFields(subject.movie),
    };
  }

  const { series } = subject;
  const base = {
    seriesId: series.id,
    tmdbId: series.tmdbId,
    title: series.title,
    posterPath: series.posterPath,
    releaseYear: series.firstAirYear,
    mediaType: "tv" as const,
  };

  if (subject.kind === "season") {
    return { ...base, seasonNumber: subject.seasonNumber };
  }

  if (subject.kind === "episode") {
    return {
      ...base,
      seasonNumber: subject.seasonNumber,
      episodeNumber: subject.episodeNumber,
    };
  }

  return base;
};

export class ActivityRecorder {
  // Awaited write: insert the row, then invalidate the actor's following
  // feed. Used by the write paths that already await their activity insert
  // inside a Promise.all alongside a notification.
  static async record(input: {
    userId: string;
    type: ActivityType;
    entityId: string;
    metadata: Record<string, unknown>;
  }): Promise<void> {
    await SocialRepository.insertActivity({
      userId: input.userId,
      type: input.type,
      entityId: input.entityId,
      metadata: JSON.stringify(input.metadata),
    });
    SocialFeedService.invalidateFollowingFeed(input.userId);
  }

  // Fire-and-forget: an activity-feed write must never block or fail the
  // primary response. The one place the "swallow errors, don't return a
  // promise" tail lives now, instead of a copy in each recorder.
  static recordDetached(input: {
    userId: string;
    type: ActivityType;
    entityId: string;
    metadata: Record<string, unknown>;
  }): void {
    void ActivityRecorder.record(input).catch(() => {});
  }

  // Media-scoped activity (movie / series / season / episode). Builds the
  // base media metadata from the subject and merges the caller's
  // content-specific extra fields on top. Fire-and-forget, like the
  // recorders it replaces. Callers still decide *whether* to record (their
  // own previous-state comparison); this owns *how*.
  static recordMedia(input: {
    userId: string;
    subject: ActivitySubject;
    type: ActivityType;
    entityId: string;
    extraMetadata?: Record<string, unknown>;
  }): void {
    ActivityRecorder.recordDetached({
      userId: input.userId,
      type: input.type,
      entityId: input.entityId,
      metadata: {
        ...buildSubjectMetadata(input.subject),
        ...input.extraMetadata,
      },
    });
  }
}
