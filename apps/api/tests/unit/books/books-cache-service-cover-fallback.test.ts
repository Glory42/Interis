import { beforeEach, describe, expect, it, mock } from "bun:test";
import * as RealGoogleBooks from "../../../src/infrastructure/googlebooks/books";
import * as RealOpenLibraryCovers from "../../../src/infrastructure/openlibrary/covers";
import * as RealBooksCacheRepositoryModule from "../../../src/modules/books/repositories/books-cache.repository";

const getBookDetailMock = mock(() => Promise.resolve<unknown>(null));
const findCoverUrlMock = mock(() => Promise.resolve<string | null>(null));

const findByVolumeIdMock = mock(() => Promise.resolve<unknown>(null));
const upsertMock = mock(() => Promise.resolve<unknown>(null));

mock.module("../../../src/infrastructure/googlebooks/books", () => ({
  ...RealGoogleBooks,
  getBookDetail: getBookDetailMock,
}));

mock.module("../../../src/infrastructure/openlibrary/covers", () => ({
  ...RealOpenLibraryCovers,
  findCoverUrl: findCoverUrlMock,
}));

mock.module("../../../src/modules/books/repositories/books-cache.repository", () => ({
  ...RealBooksCacheRepositoryModule,
  BooksCacheRepository: {
    ...RealBooksCacheRepositoryModule.BooksCacheRepository,
    findByVolumeId: findByVolumeIdMock,
    upsert: upsertMock,
  },
}));

const { BooksCacheService } = await import("../../../src/modules/books/services/books-cache.service");

const buildVolume = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "volume-1",
  volumeInfo: {
    title: "Clean Code",
    authors: ["Robert C. Martin"],
    industryIdentifiers: [{ type: "ISBN_13", identifier: "9780132350884" }],
    ...overrides,
  },
});

describe("BooksCacheService.findOrCreate Open Library cover fallback (unit)", () => {
  beforeEach(() => {
    getBookDetailMock.mockReset();
    findCoverUrlMock.mockReset();
    findByVolumeIdMock.mockReset();
    upsertMock.mockReset();
  });

  it("does not query Open Library when Google Books already has a cover", async () => {
    findByVolumeIdMock.mockResolvedValueOnce(null);
    getBookDetailMock.mockResolvedValueOnce(
      buildVolume({ imageLinks: { thumbnail: "https://books.google.com/cover.jpg" } }),
    );
    upsertMock.mockResolvedValueOnce({ id: 1 });

    await BooksCacheService.findOrCreate("volume-1");

    expect(findCoverUrlMock).not.toHaveBeenCalled();
  });

  it("falls back to Open Library's cover when Google Books has none", async () => {
    findByVolumeIdMock.mockResolvedValueOnce(null);
    getBookDetailMock.mockResolvedValueOnce(buildVolume());
    findCoverUrlMock.mockResolvedValueOnce("https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg");
    upsertMock.mockResolvedValueOnce({ id: 1 });

    await BooksCacheService.findOrCreate("volume-1");

    expect(findCoverUrlMock).toHaveBeenCalledWith("9780132350884");
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        coverImageUrl: "https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg",
      }),
    );
  });

  it("leaves coverImageUrl null when neither source has a cover", async () => {
    findByVolumeIdMock.mockResolvedValueOnce(null);
    getBookDetailMock.mockResolvedValueOnce(buildVolume());
    findCoverUrlMock.mockResolvedValueOnce(null);
    upsertMock.mockResolvedValueOnce({ id: 1 });

    await BooksCacheService.findOrCreate("volume-1");

    expect(upsertMock).toHaveBeenCalledWith(expect.objectContaining({ coverImageUrl: null }));
  });
});
