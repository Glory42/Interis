import {
  getBookDetail,
  extractIsbn13,
  parseCoverUrl,
  parsePublishedYear,
  stripHtml,
} from "../../../infrastructure/googlebooks/books";
import { BooksCacheRepository } from "../repositories/books-cache.repository";

export class BooksCacheService {
  static async findOrCreate(googleVolumeId: string) {
    const existing = await BooksCacheRepository.findByVolumeId(googleVolumeId);
    if (existing) {
      return existing;
    }

    const volume = await getBookDetail(googleVolumeId);
    const vi = volume.volumeInfo;

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
      coverImageUrl: parseCoverUrl(vi),
      isbn13: extractIsbn13(vi),
      googleBooksUrl: vi.infoLink ?? vi.canonicalVolumeLink ?? null,
    });
  }
}
