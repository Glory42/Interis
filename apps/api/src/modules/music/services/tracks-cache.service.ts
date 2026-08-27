import { getRecordingDetail } from "../../../infrastructure/musicbrainz/recordings";
import { findTrackPreview } from "../../../infrastructure/itunes/tracks";
import { TracksRepository } from "../repositories/tracks.repository";

// A resolved preview URL is effectively permanent, so once we have one we
// never look again. A "not found" result is retried after this cooldown in
// case iTunes' catalog has since caught up - same "never block the base
// fetch on it" background-refresh rule as Last.fm/NYT (see docs/adr/0003).
const PREVIEW_RETRY_MS = 30 * 24 * 60 * 60 * 1000;

export class TracksCacheService {
  static async findOrCreate(mbid: string) {
    const existing = await TracksRepository.findByMbid(mbid);
    if (existing) {
      this.maybeRefreshPreview(existing);
      return existing;
    }

    const recording = await getRecordingDetail(mbid);
    const track = await TracksRepository.upsertOne({
      recordingMbid: recording.mbid,
      title: recording.title,
      artistName: recording.artistName,
      length: recording.length,
      disambiguation: recording.disambiguation,
      discNumber: 1,
      position: 1,
    });

    if (track) {
      this.maybeRefreshPreview(track);
    }

    return track;
  }

  private static maybeRefreshPreview(track: {
    id: number;
    title: string;
    artistName: string;
    previewUrl: string | null;
    previewFetchedAt: Date | null;
  }): void {
    if (track.previewUrl) {
      return;
    }
    const isStale =
      !track.previewFetchedAt || Date.now() - track.previewFetchedAt.getTime() > PREVIEW_RETRY_MS;
    if (!isStale) {
      return;
    }

    findTrackPreview(track.artistName, track.title)
      .then((preview) => TracksRepository.updatePreview(track.id, preview?.previewUrl ?? null))
      .catch(() => undefined);
  }
}
