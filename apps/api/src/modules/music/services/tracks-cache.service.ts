import { getRecordingDetail } from "../../../infrastructure/musicbrainz/recordings";
import { TracksRepository } from "../repositories/tracks.repository";

export class TracksCacheService {
  static async findOrCreate(mbid: string) {
    const existing = await TracksRepository.findByMbid(mbid);
    if (existing) {
      return existing;
    }

    const recording = await getRecordingDetail(mbid);
    return TracksRepository.upsertOne({
      recordingMbid: recording.mbid,
      title: recording.title,
      artistName: recording.artistName,
      length: recording.length,
      disambiguation: recording.disambiguation,
      discNumber: 1,
      position: 1,
    });
  }
}
