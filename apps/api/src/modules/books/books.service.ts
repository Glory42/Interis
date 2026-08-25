import { searchBooks } from "../../infrastructure/googlebooks/books";
import type { GoogleBooksVolume } from "../../infrastructure/googlebooks/books";
import { db } from "../../infrastructure/database/db";
import { activities } from "../social/social.entity";
import type {
  BookDetailReviewSort,
  UpdateBookInteractionDto,
  UpdateBookLogDto,
  CreateBookLogDto,
  NormalizedBooksArchiveQuery,
} from "./dto/books.dto";
import { BooksCacheService } from "./services/books-cache.service";
import { BooksArchiveService } from "./services/books-archive.service";
import { BooksDetailService } from "./services/books-detail.service";
import { BooksInteractionsRepository } from "./repositories/books-interactions.repository";

const RATING_FACTOR = 2;

export class BooksService {
  static async search(query: string, language?: string): Promise<GoogleBooksVolume[]> {
    const q = language ? `${query} langRestrict=${language}` : query;
    return searchBooks(q);
  }

  static async findOrCreate(volumeId: string) {
    return BooksCacheService.findOrCreate(volumeId);
  }

  static async getDetail(input: {
    volumeId: string;
    viewerUserId?: string | null;
    reviewsSort: BookDetailReviewSort;
  }) {
    return BooksDetailService.getDetail(input);
  }

  static async getArchive(input: NormalizedBooksArchiveQuery & { viewerUserId?: string | null }) {
    return BooksArchiveService.getArchive(input);
  }

  static async getLogsByVolumeId(volumeId: string) {
    return BooksDetailService.getLogsByVolumeId(volumeId);
  }

  static async getInteraction(userId: string, volumeId: string) {
    const book = await BooksCacheService.findOrCreate(volumeId);
    if (!book) return null;
    const row = await BooksInteractionsRepository.getInteraction(userId, book.id);
    if (!row) return { liked: false, wantToRead: false, ratingOutOfTen: null, ratingOutOfFive: null };
    return {
      liked: row.liked,
      wantToRead: row.wantToRead,
      ratingOutOfTen: row.rating,
      ratingOutOfFive: row.rating !== null ? row.rating / RATING_FACTOR : null,
    };
  }

  static async updateInteraction(userId: string, volumeId: string, input: UpdateBookInteractionDto) {
    const book = await BooksCacheService.findOrCreate(volumeId);
    if (!book) return null;
    const ratingOutOfTen =
      input.ratingOutOfFive !== undefined
        ? input.ratingOutOfFive === null ? null : Math.round(input.ratingOutOfFive * RATING_FACTOR)
        : undefined;
    return BooksInteractionsRepository.upsertInteraction(userId, book.id, {
      liked: input.liked,
      wantToRead: input.wantToRead,
      rating: ratingOutOfTen,
    });
  }

  static async createLog(userId: string, volumeId: string, input: CreateBookLogDto) {
    const book = await BooksCacheService.findOrCreate(volumeId);
    if (!book) return null;
    const rating = input.ratingOutOfFive !== undefined
      ? Math.round(input.ratingOutOfFive * RATING_FACTOR)
      : null;
    const entry = await BooksInteractionsRepository.createLog(userId, book.id, {
      readDate: input.readDate,
      rating,
      reread: input.reread ?? false,
    });
    if (entry) {
      await db.insert(activities).values({
        userId,
        type: "diary_entry",
        entityId: entry.id,
        metadata: JSON.stringify({
          mediaType: "book",
          volumeId: book.googleVolumeId,
          title: book.title,
          authors: book.authors ?? [],
          coverArtUrl: book.coverImageUrl ?? null,
          releaseYear: book.publishedYear ?? null,
          rating: entry.rating ?? null,
          reread: entry.reread,
          hasReview: false,
        }),
      }).catch(() => undefined);
    }
    return { entry, book };
  }

  static async getMyLogs(userId: string) {
    return BooksInteractionsRepository.getMyLogs(userId);
  }

  static async updateLog(id: string, userId: string, input: UpdateBookLogDto) {
    const ratingOutOfTen =
      input.ratingOutOfFive !== undefined
        ? input.ratingOutOfFive === null ? null : Math.round(input.ratingOutOfFive * RATING_FACTOR)
        : undefined;
    return BooksInteractionsRepository.updateLog(id, userId, {
      readDate: input.readDate,
      rating: ratingOutOfTen,
      reread: input.reread,
    });
  }

  static async deleteLog(id: string, userId: string) {
    return BooksInteractionsRepository.deleteLog(id, userId);
  }
}
