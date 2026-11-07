import type {
  ActivityRow,
  FeedActivityKind,
  FeedDiaryEntryRow,
  FeedEngagement,
  FeedFilmRow,
  FeedItem,
  FeedListRow,
  FeedMetadata,
  FeedPostRow,
  FeedRawMetadata,
  FeedTitleGroup,
  FeedUserRow,
  PostEngagement,
  ReviewContext,
  SocialActivity,
} from "./social-feed.types";

// One activity row with its metadata parsed once for the whole page.
export type ParsedActivity = {
  row: ActivityRow;
  activity: SocialActivity;
  raw: FeedRawMetadata;
  metadata: FeedMetadata;
  kind: FeedActivityKind;
};

// Ids a page of activities needs, each set loaded with one query per table.
export type FeedIds = {
  reviews: Set<string>;
  // Diary entries: the live log, and any review attached to it.
  logs: Set<string>;
  posts: Set<string>;
  films: Set<number>;
  lists: Set<string>;
  users: Set<string>;
  // Activities whose likes are their own, not a review's or a post's.
  likedActivities: Set<string>;
};

export type FeedContext = {
  reviews: ReviewContext;
  posts: Map<string, FeedPostRow>;
  postEngagement: Map<string, PostEngagement>;
  films: Map<number, FeedFilmRow>;
  logs: Map<string, FeedDiaryEntryRow>;
  lists: Map<string, FeedListRow>;
  users: Map<string, FeedUserRow>;
  activityEngagement: Map<string, FeedEngagement>;
};

// Everything the Following Feed knows about one activity kind.
export type FeedKind = {
  collect: (activity: ParsedActivity, ids: FeedIds) => void;
  // True once the content the activity is about is gone (or hidden).
  isDead: (activity: ParsedActivity, context: FeedContext) => boolean;
  project: (activity: ParsedActivity, context: FeedContext) => FeedItem;
  // Set for kinds that merge into one person's same-day card for a title.
  joinTitleGroup?: (group: FeedTitleGroup, item: FeedItem) => void;
  // A like, left out of the grouped feed when it's of the actor's own content.
  isLike?: true;
};
