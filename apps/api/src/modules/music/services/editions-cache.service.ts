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

  // The Album's Track list per ADR-0002: the union of every distinct Track
  // across all of its Editions. Eagerly fetching every edition's tracklist
  // to build a complete union would mean dozens of MusicBrainz calls for a
  // single album view, which the "never bulk imported" caching rule rules
  // out - so on a cold union (nothing cached from any edition yet) this
  // seeds it from just the single best-ranked edition (same official-first-
  // then-earliest-date ordering used for the Editions list) rather than all
  // of them. The union then grows incrementally as users open more editions.
  static async findOrCreateTrackUnionForAlbum(albumId: number, albumMbid: string) {
    const existingUnion = await TracksRepository.findUnionByAlbumId(albumId);
    if (existingUnion.length > 0) {
      return existingUnion;
    }

    const editions = await this.findOrCreateEditionsForAlbum(albumId, albumMbid);
    const bestEdition = editions[0];
    if (!bestEdition) {
      return [];
    }

    await this.findOrCreateTracklistForEdition(bestEdition.id, bestEdition.mbid);
    return TracksRepository.findUnionByAlbumId(albumId);
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
