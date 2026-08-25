import { toMediaFields } from "../../../commons/helpers/media-activity-fields.helper";
import { SocialRepository, type ActivityType } from "../../social/repositories/social.repository";
import { SocialFeedService } from "../../social/services/social-feed.service";

export type BookActivityBookInfo = {
  id: number;
  googleVolumeId: string;
  title: string;
  coverImageUrl: string | null;
  authors: string[];
  publishedYear: number | null;
};

// Mirrors MovieActivityRecorder/SerialsActivityRecorder - the single entry
// point every book write path (likes, want-to-read, diary entries, reviews)
// uses to record an activity-feed row.
export class BookActivityRecorder {
  static record(input: {
    userId: string;
    book: BookActivityBookInfo;
    type: ActivityType;
    entityId: string;
    extraMetadata?: Record<string, unknown>;
  }): void {
    const metadata = JSON.stringify({
      mediaType: "book" as const,
      ...toMediaFields({
        volumeId: input.book.googleVolumeId,
        title: input.book.title,
        coverArtUrl: input.book.coverImageUrl,
        authors: input.book.authors,
        releaseYear: input.book.publishedYear,
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
