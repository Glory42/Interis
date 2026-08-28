import { searchAlbums } from "../../infrastructure/musicbrainz/albums";
import type { IReleaseGroup } from "../../infrastructure/musicbrainz/albums";
import { db } from "../../infrastructure/database/db";
import { activities } from "../social/social.entity";
import type {
  MusicDetailReviewSort,
  UpdateMusicInteractionDto,
  UpdateMusicLogDto,
  CreateMusicLogDto,
} from "./dto/music.dto";
import { MusicCacheService } from "./services/music-cache.service";
import { MusicArchiveService } from "./services/music-archive.service";
import { MusicDetailService } from "./services/music-detail.service";
import { MusicInteractionsRepository } from "./repositories/music-interactions.repository";
import type { NormalizedMusicArchiveQuery } from "./dto/music.dto";

export class MusicService {
  static async search(query: string): Promise<IReleaseGroup[]> {
    return searchAlbums(query);
  }

  static async findOrCreate(mbid: string) {
    return MusicCacheService.findOrCreate(mbid);
  }

  static async getDetail(input: {
    mbid: string;
    viewerUserId?: string | null;
    reviewsSort: MusicDetailReviewSort;
  }) {
    return MusicDetailService.getDetail(input);
  }

  static async getArchive(input: NormalizedMusicArchiveQuery & { viewerUserId?: string | null }) {
    return MusicArchiveService.getArchive(input);
  }

  static async getLogsByMbid(mbid: string) {
    return MusicDetailService.getLogsByMbid(mbid);
  }

  static async getInteraction(userId: string, mbid: string) {
    const album = await MusicCacheService.findOrCreate(mbid);
    if (!album) return null;
    const row = await MusicInteractionsRepository.getInteraction(userId, album.id);
    if (!row) return { liked: false, wantToListen: false, rating: null };
    return {
      liked: row.liked,
      wantToListen: row.wantToListen,
      rating: row.rating,
    };
  }

  static async updateInteraction(userId: string, mbid: string, input: UpdateMusicInteractionDto) {
    const album = await MusicCacheService.findOrCreate(mbid);
    if (!album) return null;
    return MusicInteractionsRepository.upsertInteraction(userId, album.id, {
      liked: input.liked,
      wantToListen: input.wantToListen,
      rating: input.rating,
    });
  }

  static async createLog(userId: string, mbid: string, input: CreateMusicLogDto) {
    const album = await MusicCacheService.findOrCreate(mbid);
    if (!album) return null;
    const rating = input.rating ?? null;
    const entry = await MusicInteractionsRepository.createLog(userId, album.id, {
      listenedDate: input.listenedDate,
      rating,
      relisten: input.relisten ?? false,
    });
    if (entry) {
      await db.insert(activities).values({
        userId,
        type: "diary_entry",
        entityId: entry.id,
        metadata: JSON.stringify({
          mediaType: "album",
          mbid: album.mbid,
          title: album.title,
          artistName: album.artistName,
          coverArtUrl: album.coverArtUrl ?? null,
          releaseYear: album.firstReleaseYear ?? null,
          rating: entry.rating ?? null,
          relisten: entry.relisten,
          hasReview: false,
        }),
      }).catch(() => undefined);
    }
    return { entry, album };
  }

  static async getMyLogs(userId: string) {
    return MusicInteractionsRepository.getMyLogs(userId);
  }

  static async updateLog(id: string, userId: string, input: UpdateMusicLogDto) {
    return MusicInteractionsRepository.updateLog(id, userId, {
      listenedDate: input.listenedDate,
      rating: input.rating,
      relisten: input.relisten,
    });
  }

  static async deleteLog(id: string, userId: string) {
    return MusicInteractionsRepository.deleteLog(id, userId);
  }
}
