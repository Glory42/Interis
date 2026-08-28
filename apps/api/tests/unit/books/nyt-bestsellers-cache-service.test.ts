import { beforeEach, describe, expect, it, mock } from "bun:test";
import * as RealNytBooks from "../../../src/infrastructure/nyt/books";
import * as RealNytRepositoryModule from "../../../src/modules/books/repositories/nyt-bestsellers-cache.repository";

const getBestsellersListMock = mock(() => Promise.resolve<unknown>([]));
const findByListNameMock = mock(() => Promise.resolve<unknown>(null));
const upsertMock = mock(() => Promise.resolve<unknown>(null));

mock.module("../../../src/infrastructure/nyt/books", () => ({
  ...RealNytBooks,
  getBestsellersList: getBestsellersListMock,
}));

mock.module("../../../src/modules/books/repositories/nyt-bestsellers-cache.repository", () => ({
  ...RealNytRepositoryModule,
  NytBestsellersCacheRepository: {
    ...RealNytRepositoryModule.NytBestsellersCacheRepository,
    findByListName: findByListNameMock,
    upsert: upsertMock,
  },
}));

const { NytBestsellersCacheService } = await import(
  "../../../src/modules/books/services/nyt-bestsellers-cache.service"
);

const buildItems = () => [{ rank: 1, isbn13: "9781234567897", title: "T", author: "A" }];

describe("NytBestsellersCacheService.getTrendingList (unit)", () => {
  beforeEach(() => {
    getBestsellersListMock.mockReset();
    findByListNameMock.mockReset();
    upsertMock.mockReset();
  });

  it("returns the cached list without calling NYT when it is fresh", async () => {
    const items = buildItems();
    findByListNameMock.mockResolvedValueOnce({ items, fetchedAt: new Date() });

    const result = await NytBestsellersCacheService.getTrendingList("hardcover-fiction");

    expect(result).toBe(items);
    expect(getBestsellersListMock).not.toHaveBeenCalled();
  });

  it("serves the stale cache immediately and refreshes in the background", async () => {
    const staleItems = buildItems();
    const freshItems = [{ rank: 1, isbn13: "9789999999999", title: "New", author: "B" }];
    findByListNameMock.mockResolvedValueOnce({
      items: staleItems,
      fetchedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });
    getBestsellersListMock.mockResolvedValueOnce(freshItems);

    const result = await NytBestsellersCacheService.getTrendingList("hardcover-fiction");

    expect(result).toBe(staleItems);
    // background refresh kicked off, not necessarily awaited yet
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getBestsellersListMock).toHaveBeenCalledTimes(1);
    expect(upsertMock).toHaveBeenCalledWith("hardcover-fiction", freshItems);
  });

  it("blocks on a genuinely cold cache (nothing to serve yet)", async () => {
    const items = buildItems();
    findByListNameMock.mockResolvedValueOnce(null);
    getBestsellersListMock.mockResolvedValueOnce(items);
    upsertMock.mockResolvedValueOnce({ items, fetchedAt: new Date() });

    const result = await NytBestsellersCacheService.getTrendingList("hardcover-fiction");

    expect(getBestsellersListMock).toHaveBeenCalledTimes(1);
    expect(upsertMock).toHaveBeenCalledWith("hardcover-fiction", items);
    expect(result).toEqual(items);
  });
});
