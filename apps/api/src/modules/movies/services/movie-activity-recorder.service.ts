import { toMediaFields } from "../../../commons/helpers/media-activity-fields.helper";
import { SocialRepository, type ActivityType } from "../../social/repositories/social.repository";
import { SocialFeedService } from "../../social/services/social-feed.service";

export type MovieActivityMovieInfo = {
  id: number;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
};

// The single entry point every movie write path uses to record an
// activity-feed row - likes, watchlist toggles, diary entries, and reviews
// all go through here instead of each call site separately deciding the
// base metadata shape and firing its own invalidation. Mirrors
// SerialsActivityRecorder's mechanism; movies have no season/episode
// nesting, so there's no target discriminator to thread through.
//
// Deliberately fire-and-forget: an activity-feed write must never block or
// fail the primary response, so record() doesn't return a promise callers
// are expected to await.
export class MovieActivityRecorder {
  static record(input: {
    userId: string;
    movie: MovieActivityMovieInfo;
    type: ActivityType;
    entityId: string;
    extraMetadata?: Record<string, unknown>;
  }): void {
    const metadata = JSON.stringify({
      movieId: input.movie.id,
      mediaType: "movie" as const,
      ...toMediaFields(input.movie),
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
