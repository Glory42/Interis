import { db } from "../../../infrastructure/database/db";
import { activities } from "../../social/social.entity";
import { TracksCacheService } from "./tracks-cache.service";
import { TrackDetailService } from "./track-detail.service";
import { TrackInteractionsRepository } from "../repositories/track-interactions.repository";
import type {
  CreateTrackLogDto,
  TrackDetailReviewSort,
  UpdateTrackInteractionDto,
  UpdateTrackLogDto,
} from "../dto/tracks.dto";

export class TracksService {
  static async findOrCreate(mbid: string) {
    return TracksCacheService.findOrCreate(mbid);
  }

  static async getDetail(input: {
    mbid: string;
    viewerUserId?: string | null;
    reviewsSort: TrackDetailReviewSort;
  }) {
    return TrackDetailService.getDetail(input);
  }

  static async getLogsByMbid(mbid: string) {
    const track = await TracksCacheService.findOrCreate(mbid);
    if (!track) return null;
    return TrackInteractionsRepository.getLogsByTrackId(track.id);
  }

  static async getInteraction(userId: string, mbid: string) {
    const track = await TracksCacheService.findOrCreate(mbid);
    if (!track) return null;
    const row = await TrackInteractionsRepository.getInteraction(userId, track.id);
    if (!row) return { liked: false, rating: null };
    return { liked: row.liked, rating: row.rating };
  }

  static async updateInteraction(userId: string, mbid: string, input: UpdateTrackInteractionDto) {
    const track = await TracksCacheService.findOrCreate(mbid);
    if (!track) return null;
    return TrackInteractionsRepository.upsertInteraction(userId, track.id, {
      liked: input.liked,
      rating: input.rating,
    });
  }

  static async createLog(userId: string, mbid: string, input: CreateTrackLogDto) {
    const track = await TracksCacheService.findOrCreate(mbid);
    if (!track) return null;
    const rating = input.rating ?? null;
    const entry = await TrackInteractionsRepository.createLog(userId, track.id, {
      listenedDate: input.listenedDate,
      rating,
      relisten: input.relisten ?? false,
    });
    if (entry) {
      await db
        .insert(activities)
        .values({
          userId,
          type: "diary_entry",
          entityId: entry.id,
          metadata: JSON.stringify({
            mediaType: "track",
            mbid: track.mbid,
            title: track.title,
            artistName: track.artistName,
            rating: entry.rating ?? null,
            relisten: entry.relisten,
            hasReview: false,
          }),
        })
        .catch(() => undefined);
    }
    return { entry, track };
  }

  static async getMyLogs(userId: string) {
    return TrackInteractionsRepository.getMyLogs(userId);
  }

  static async updateLog(id: string, userId: string, input: UpdateTrackLogDto) {
    return TrackInteractionsRepository.updateLog(id, userId, {
      listenedDate: input.listenedDate,
      rating: input.rating,
      relisten: input.relisten,
    });
  }

  static async deleteLog(id: string, userId: string) {
    return TrackInteractionsRepository.deleteLog(id, userId);
  }
}
