import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { groupedFeedInfiniteQueryOptions } from "@/features/feed/hooks/useFeed";
import type {
  FeedFilter,
  FeedItem,
  FeedRow,
  FeedTitleGroup,
  GroupedFeedPage,
} from "@/features/feed/types";

const actor = { id: "actor-1", username: "actor", displayUsername: null, avatarUrl: null };
const film = { tmdbId: 550, title: "Fight Club", posterPath: null, releaseYear: 1999, mediaType: "movie" as const };
const engagement = { likeCount: 0, commentCount: 0, viewerHasLiked: false };

const baseMetadata: FeedItem["metadata"] = {
  action: null,
  excerpt: null,
  targetUsername: null,
  rating: null,
  rewatch: null,
  containsSpoilers: null,
  reviewId: null,
  commentId: null,
  movieId: null,
  postId: null,
  postMediaId: null,
  postMediaType: null,
};

export const makeFeedItem = (
  overrides: Partial<Omit<FeedItem, "metadata">> & { metadata?: Partial<FeedItem["metadata"]> } = {},
): FeedItem => ({
  id: "activity-1",
  type: "review",
  kind: "review",
  createdAt: "2026-01-01T00:00:00.000Z",
  actor,
  movie: film,
  post: null,
  review: null,
  engagement,
  ...overrides,
  metadata: { ...baseMetadata, ...overrides.metadata },
});

export const makeTitleGroup = (overrides: Partial<FeedTitleGroup> = {}): FeedTitleGroup => ({
  kind: "title",
  id: "group-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  actor,
  movie: film,
  seasonNumber: null,
  episodeNumber: null,
  watched: true,
  rewatch: false,
  rating: 8,
  liked: false,
  watchlisted: false,
  review: null,
  log: null,
  engagement,
  itemIds: ["activity-1"],
  ...overrides,
});

export const activity = (item: FeedItem, day = "2026-01-01"): FeedRow => ({ kind: "activity", key: item.id, day, item });

export const titleRow = (group: FeedTitleGroup, day = "2026-01-01"): FeedRow => ({ kind: "title", key: group.id, day, group });

type GroupedFeedData = InfiniteData<GroupedFeedPage, string | undefined>;

// Seeds the grouped Following Feed under the exact key useGroupedFeed reads.
export const seedGroupedFeed = (
  queryClient: QueryClient,
  pages: FeedRow[][],
  filter: FeedFilter = "all",
): GroupedFeedData => {
  const data: GroupedFeedData = {
    pages: pages.map((rows, index) => ({ rows, nextCursor: index < pages.length - 1 ? `c${index}` : null })),
    pageParams: pages.map((_, index) => (index === 0 ? undefined : `c${index - 1}`)),
  };
  queryClient.setQueryData(groupedFeedInfiniteQueryOptions(filter).queryKey, data);
  return data;
};

export const readGroupedFeed = (queryClient: QueryClient, filter: FeedFilter = "all"): FeedRow[] =>
  queryClient
    .getQueryData<GroupedFeedData>(groupedFeedInfiniteQueryOptions(filter).queryKey)
    ?.pages.flatMap((page) => page.rows) ?? [];
