import { searchBooks, parseCoverUrl, parsePublishedYear } from "../../../infrastructure/googlebooks/books";
import { BooksCacheRepository } from "../repositories/books-cache.repository";
import { BooksArchiveRepository } from "../repositories/books-archive.repository";

const SEED_QUERIES = [
  "fiction",
  "thriller",
  "science",
  "biography",
  "history",
  "fantasy",
  "romance",
];

const SEED_THRESHOLD = 20;

export class BooksSeedService {
  static async seedIfEmpty(): Promise<void> {
    const count = await BooksArchiveRepository.getTotalCount();
    if (count >= SEED_THRESHOLD) return;

    const pages = await Promise.allSettled(
      SEED_QUERIES.map((q) => searchBooks(q)),
    );

    const seen = new Set<string>();

    const volumes = pages.flatMap((result) => {
      if (result.status === "rejected") return [];
      return result.value.filter((v) => {
        if (seen.has(v.id)) return false;
        seen.add(v.id);
        return true;
      });
    });

    await Promise.allSettled(
      volumes.map((v) => {
        const vi = v.volumeInfo;
        return BooksCacheRepository.upsert({
          googleVolumeId: v.id,
          title: vi.title,
          subtitle: vi.subtitle ?? null,
          authors: vi.authors ?? [],
          publisher: vi.publisher ?? null,
          publishedDate: vi.publishedDate ?? null,
          publishedYear: parsePublishedYear(vi),
          pageCount: vi.pageCount ?? null,
          language: vi.language ?? null,
          categories: vi.categories ?? [],
          description: null,
          coverImageUrl: parseCoverUrl(vi),
          isbn13: null,
          googleBooksUrl: null,
        });
      }),
    );
  }
}
