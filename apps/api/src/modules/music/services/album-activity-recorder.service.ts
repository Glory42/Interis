import { toMediaFields } from "../../../commons/helpers/media-activity-fields.helper";
import { SocialRepository, type ActivityType } from "../../social/repositories/social.repository";
import { SocialFeedService } from "../../social/services/social-feed.service";

export type AlbumActivityAlbumInfo = {
  id: number;
  mbid: string;
  title: string;
  coverArtUrl: string | null;
  artistName: string;
  firstReleaseYear: number | null;
};

// Mirrors MovieActivityRecorder/SerialsActivityRecorder - the single entry
// point every album write path (likes, want-to-listen, diary entries,
// reviews) uses to record an activity-feed row.
export class AlbumActivityRecorder {
  static record(input: {
    userId: string;
    album: AlbumActivityAlbumInfo;
    type: ActivityType;
    entityId: string;
    extraMetadata?: Record<string, unknown>;
  }): void {
    const metadata = JSON.stringify({
      mediaType: "album" as const,
      ...toMediaFields({
        mbid: input.album.mbid,
        title: input.album.title,
        coverArtUrl: input.album.coverArtUrl,
        artistName: input.album.artistName,
        releaseYear: input.album.firstReleaseYear,
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
