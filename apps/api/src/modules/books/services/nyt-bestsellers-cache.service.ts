import { getBestsellersList } from "../../../infrastructure/nyt/books";
import { NytBestsellersCacheRepository } from "../repositories/nyt-bestsellers-cache.repository";

// NYT caps free-tier usage at 1000 requests/day and only republishes each
// list weekly, so this is TTL-cached with lazy background refresh (see
// docs/adr/0003) rather than live-fetched per request like TMDB trending.
const TTL_MS = 12 * 60 * 60 * 1000;

export class NytBestsellersCacheService {
  static async getTrendingList(listName: string) {
    const cached = await NytBestsellersCacheRepository.findByListName(listName);

    if (!cached) {
      // True cold start - nothing to serve yet, so this one lookup blocks.
      const items = await getBestsellersList(listName).catch(() => []);
      if (items.length === 0) {
        return items;
      }
      const row = await NytBestsellersCacheRepository.upsert(listName, items);
      return row?.items ?? items;
    }

    const isStale = Date.now() - cached.fetchedAt.getTime() > TTL_MS;
    if (isStale) {
      // Serve the stale-but-present cache immediately; refresh in the
      // background so nobody's request waits on NYT.
      getBestsellersList(listName)
        .then((items) => NytBestsellersCacheRepository.upsert(listName, items))
        .catch(() => undefined);
    }

    return cached.items;
  }
}
