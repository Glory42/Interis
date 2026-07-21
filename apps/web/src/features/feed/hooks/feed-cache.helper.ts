import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { feedKeys } from "@/features/feed/hooks/useFeed";
import type { FeedItem } from "@/features/feed/types";

type FeedPage = { items: FeedItem[]; nextCursor: string | null };
type FeedInfiniteData = InfiniteData<FeedPage, string | undefined>;

// Patches matching feed items across every cached page without a full
// refetch. The feed is a useInfiniteQuery, so its cache is
// `{ pages, pageParams }`, not a flat FeedItem[] - this walks
// `.pages[].items[]` accordingly.
export const patchFeedItems = (
  queryClient: QueryClient,
  matches: (item: FeedItem) => boolean,
  updater: (item: FeedItem) => FeedItem,
) => {
  const queryKey = feedKeys.followingRoot;
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
