import {
  getBookDetail,
  searchBooks,
  extractIsbn13,
  parseCoverUrl,
  parsePublishedYear,
  stripHtml,
  type GoogleBooksVolume,
} from "../../../infrastructure/googlebooks/books";
import { findCoverUrl as findOpenLibraryCoverUrl } from "../../../infrastructure/openlibrary/covers";
import { BooksCacheRepository } from "../repositories/books-cache.repository";

export class BooksCacheService {
  static async findOrCreate(googleVolumeId: string) {
    const existing = await BooksCacheRepository.findByVolumeId(googleVolumeId);
    if (existing) {
      return existing;
    }

    const volume = await getBookDetail(googleVolumeId);
    return this.upsertFromVolume(volume);
  }

  // Resolves an ISBN-13 (e.g. from an NYT bestseller entry) to a cached Book
  // row via Google Books' isbn: search, creating it on first lookup - the
  // same on-demand caching every other media type uses, just keyed off ISBN
  // instead of a known Google volume id.
  static async findOrCreateByIsbn(isbn13: string) {
    const existing = await BooksCacheRepository.findByIsbn13(isbn13);
    if (existing) {
      return existing;
    }

    const results = await searchBooks(`isbn:${isbn13}`);
    const volume = results[0];
    if (!volume) {
      return null;
    }

    return this.upsertFromVolume(volume);
  }

  private static async upsertFromVolume(volume: GoogleBooksVolume) {
    const vi = volume.volumeInfo;
    const isbn13 = extractIsbn13(vi);

    let coverImageUrl = parseCoverUrl(vi);
    if (!coverImageUrl && isbn13) {
      coverImageUrl = await findOpenLibraryCoverUrl(isbn13).catch(() => null);
    }

    return BooksCacheRepository.upsert({
      googleVolumeId: volume.id,
      title: vi.title,
      subtitle: vi.subtitle ?? null,
      authors: vi.authors ?? [],
      publisher: vi.publisher ?? null,
      publishedDate: vi.publishedDate ?? null,
      publishedYear: parsePublishedYear(vi),
      pageCount: vi.pageCount ?? vi.printedPageCount ?? null,
      language: vi.language ?? null,
      categories: vi.categories ?? [],
      description: vi.description ? stripHtml(vi.description) : null,
      coverImageUrl,
      isbn13,
      googleBooksUrl: vi.infoLink ?? vi.canonicalVolumeLink ?? null,
    });
  }
}
