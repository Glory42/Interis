import {
  ActivityRecorder,
  type SeriesActivityInfo,
} from "../../social/services/activity-recorder.service";

type LevelSubject =
  | { kind: "season"; series: SeriesActivityInfo; seasonNumber: number }
  | {
      kind: "episode";
      series: SeriesActivityInfo;
      seasonNumber: number;
      episodeNumber: number;
    };

type InteractionState = { liked: boolean; rating: number | null };

// Feed rows for a season/episode like or rating change. Both are recorded
// as `liked_movie` against the series id (a rating carries `rating` in its
// metadata), and taken back out when the like or rating is undone (#76).
export class SerialsLevelActivityService {
  static async syncInteraction(input: {
    userId: string;
    subject: LevelSubject;
    change: { liked?: boolean; rating?: number | null };
    previous: InteractionState | null;
    current: InteractionState;
  }): Promise<void> {
    const { userId, subject, change, previous, current } = input;
    const previousLiked = previous?.liked ?? false;
    const base = { userId, subject, type: "liked_movie", entityId: String(subject.series.id) } as const;

    if (change.liked === true && !previousLiked && current.liked) {
      ActivityRecorder.recordMedia(base);
    }

    if (
      change.rating !== undefined &&
      change.rating !== null &&
      current.rating !== null &&
      current.rating !== previous?.rating
    ) {
      ActivityRecorder.recordMedia({ ...base, extraMetadata: { rating: current.rating } });
    }

    await Promise.all([
      change.liked === false && previousLiked ? ActivityRecorder.retractMedia(base) : null,
      change.rating === null && previous?.rating != null
        ? ActivityRecorder.retractMedia({ ...base, rated: true })
        : null,
    ]);
  }
}
