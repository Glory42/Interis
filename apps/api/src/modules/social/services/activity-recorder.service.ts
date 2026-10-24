import { toMediaFields } from "../../../commons/helpers/media-activity-fields.helper";
import {
  SocialRepository,
  type ActivityMetadataFilter,
  type ActivityType,
} from "../repositories/social.repository";
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

// Picks out one subject's rows among those sharing a (type, entityId) pair -
// see ActivityMetadataFilter. Season and episode ratings are recorded as
// `liked_movie` rows carrying a `rating`, so `rated` keeps a like's
// retraction from also removing the rating's row, and vice versa.
const buildSubjectFilter = (subject: ActivitySubject, rated: boolean): ActivityMetadataFilter => {
  const hasKeys = rated ? ["rating"] : [];
  const missingKeys = rated ? [] : ["rating"];

  if (subject.kind === "movie") {
    return { contains: { movieId: subject.movie.id }, hasKeys, missingKeys };
  }

  const seriesId = subject.series.id;
  if (subject.kind === "series") {
    return {
      contains: { seriesId, mediaType: "tv" },
      hasKeys,
      missingKeys: [...missingKeys, "seasonNumber", "episodeNumber"],
    };
  }

  if (subject.kind === "season") {
    return {
      contains: { seriesId, seasonNumber: subject.seasonNumber },
      hasKeys,
      missingKeys: [...missingKeys, "episodeNumber"],
    };
  }

  return {
    contains: {
      seriesId,
      seasonNumber: subject.seasonNumber,
      episodeNumber: subject.episodeNumber,
    },
    hasKeys,
    missingKeys,
  };
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

  // Undo of record(): deletes the actor's rows for an action they reversed
  // (unlike, un-watchlist, unfollow) so followers stop seeing it. Removes
  // every matching row, duplicates included. Awaited, so a quick undo then
  // redo can't have this delete land after the redo's new row, but it never
  // fails the request: a stale feed row is better than a failed unlike.
  static async retract(input: {
    userId: string;
    type: ActivityType;
    entityId: string;
    metadata?: ActivityMetadataFilter;
  }): Promise<void> {
    try {
      const deleted = await SocialRepository.deleteActivities(input);
      if (deleted.length > 0) {
        ActivityRecorder.invalidateFeeds(input.userId);
      }
    } catch {
      // Swallowed on purpose, see above.
    }
  }

  // The thing an activity is about was edited in place (e.g. a log's
  // rating): the row stays, but cached feeds showing it are now stale.
  static invalidateFeeds(userId: string): void {
    SocialFeedService.invalidateFollowingFeed(userId);
    SocialFeedService.invalidateUserActivityFeed(userId);
  }

  // Media-scoped retract, matching recordMedia's subject.
  static async retractMedia(input: {
    userId: string;
    subject: ActivitySubject;
    type: ActivityType;
    entityId: string;
    rated?: boolean;
  }): Promise<void> {
    await ActivityRecorder.retract({
      userId: input.userId,
      type: input.type,
      entityId: input.entityId,
      metadata: buildSubjectFilter(input.subject, input.rated ?? false),
    });
  }
}
