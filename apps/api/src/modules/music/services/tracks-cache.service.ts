import { getRecordingDetail } from "../../../infrastructure/musicbrainz/recordings";
import { findTrackPreview } from "../../../infrastructure/itunes/tracks";
import { TracksRepository } from "../repositories/tracks.repository";

// A resolved preview URL is effectively permanent, so once we have one we
// never look again. A "not found" result is retried after this cooldown in
// case iTunes' catalog has since caught up.
const PREVIEW_RETRY_MS = 30 * 24 * 60 * 60 * 1000;

type TrackRow = {
  id: number;
  title: string;
  artistName: string;
  previewUrl: string | null;
  previewFetchedAt: Date | null;
};

export class TracksCacheService {
  static async findOrCreate(mbid: string) {
    const existing = await TracksRepository.findByMbid(mbid);
    if (existing) {
      return this.ensurePreview(existing);
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

    return track ? this.ensurePreview(track) : track;
  }

  // The track's first-ever preview lookup blocks so the response the
  // viewer actually sees already has it - the same "block on creation"
  // rule coverArtUrl follows for a new Album. Only a *retry* of an
  // already-checked-and-not-found preview stays background/fire-and-forget
  // (see docs/adr/0003) - a missing preview on a well-established track is
  // low-stakes enough not to hold up every future request for it.
  private static async ensurePreview<T extends TrackRow>(track: T): Promise<T> {
    if (track.previewUrl) {
      return track;
    }

    if (!track.previewFetchedAt) {
      const preview = await findTrackPreview(track.artistName, track.title).catch(() => null);
      const updated = await TracksRepository.updatePreview(track.id, preview?.previewUrl ?? null);
      return (updated as T | null) ?? track;
    }

    const isStale = Date.now() - track.previewFetchedAt.getTime() > PREVIEW_RETRY_MS;
    if (isStale) {
      findTrackPreview(track.artistName, track.title)
        .then((preview) => TracksRepository.updatePreview(track.id, preview?.previewUrl ?? null))
        .catch(() => undefined);
    }

    return track;
  }
}
