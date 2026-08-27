import {
  getReleasesForReleaseGroup,
  getReleaseTracklist,
} from "../../../infrastructure/musicbrainz/editions";
import { EditionsRepository } from "../repositories/editions.repository";
import { TracksRepository } from "../repositories/tracks.repository";

export class EditionsCacheService {
  static async findOrCreateEditionsForAlbum(albumId: number, albumMbid: string) {
    const existing = await EditionsRepository.findByAlbumId(albumId);
    if (existing.length > 0) {
      return existing;
    }

    const releaseStubs = await getReleasesForReleaseGroup(albumMbid);
    await EditionsRepository.upsertMany(albumId, releaseStubs);
    return EditionsRepository.findByAlbumId(albumId);
  }

  static async findOrCreateTracklistByEditionMbid(editionMbid: string) {
    const edition = await EditionsRepository.findByMbid(editionMbid);
    if (!edition) {
      return null;
    }
    return this.findOrCreateTracklistForEdition(edition.id, edition.mbid);
  }

  static async findOrCreateTracklistForEdition(editionId: number, editionMbid: string) {
    const existingTracks = await TracksRepository.findByEditionId(editionId);
    if (existingTracks.length > 0) {
      return existingTracks;
    }

    const { format, trackCount, tracks: trackStubs } = await getReleaseTracklist(editionMbid);
    const idByMbid = await TracksRepository.upsertMany(trackStubs);

    const entries = trackStubs.flatMap((stub) => {
      const trackId = idByMbid.get(stub.recordingMbid);
      return trackId
        ? [{ trackId, discNumber: stub.discNumber, position: stub.position }]
        : [];
    });

    await TracksRepository.replaceEditionTracklist(editionId, entries);
    await EditionsRepository.updateTracklistMeta(editionId, { format, trackCount });

    return TracksRepository.findByEditionId(editionId);
  }
}
