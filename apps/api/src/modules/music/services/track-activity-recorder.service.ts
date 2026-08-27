import { toMediaFields } from "../../../commons/helpers/media-activity-fields.helper";
import { SocialRepository, type ActivityType } from "../../social/repositories/social.repository";
import { SocialFeedService } from "../../social/services/social-feed.service";

export type TrackActivityTrackInfo = {
  id: number;
  mbid: string;
  title: string;
  artistName: string;
};

// Mirrors AlbumActivityRecorder - the single entry point every track write
// path (likes, diary entries, reviews) uses to record an activity-feed row.
export class TrackActivityRecorder {
  static record(input: {
    userId: string;
    track: TrackActivityTrackInfo;
    type: ActivityType;
    entityId: string;
    extraMetadata?: Record<string, unknown>;
  }): void {
    const metadata = JSON.stringify({
      mediaType: "track" as const,
      ...toMediaFields({
        mbid: input.track.mbid,
        title: input.track.title,
        coverArtUrl: null,
        artistName: input.track.artistName,
        releaseYear: null,
      }),
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
