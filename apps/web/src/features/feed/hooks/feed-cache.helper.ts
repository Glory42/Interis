import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { feedKeys } from "@/features/feed/hooks/useFeed";
import type { FeedItem } from "@/features/feed/types";

type FeedPage = { items: FeedItem[]; nextCursor: string | null };
type FeedInfiniteData = InfiniteData<FeedPage, string | undefined>;

// Patches every feed item matching `matches` across every cached page of the
// following-feed infinite query - used by any mutation whose effect should
// show up on feed cards (likes, comment counts, review edits) without
// waiting on a full feed refetch. The following feed is a useInfiniteQuery,
// so its cache entry is `{ pages, pageParams }`, not a flat FeedItem[] -
// this walks `.pages[].items[]` correctly instead of assuming a flat array.
export const patchFeedItems = (
  queryClient: QueryClient,
  matches: (item: FeedItem) => boolean,
  updater: (item: FeedItem) => FeedItem,
) => {
  const queryKey = feedKeys.following;
  const previousQueries = queryClient.getQueriesData<FeedInfiniteData>({
    queryKey,
    exact: false,
  });

  queryClient.setQueriesData<FeedInfiniteData>({ queryKey, exact: false }, (old) => {
    if (!old) {
      return old;
    }

    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        items: page.items.map((item) => (matches(item) ? updater(item) : item)),
      })),
    };
  });

  return previousQueries;
};
