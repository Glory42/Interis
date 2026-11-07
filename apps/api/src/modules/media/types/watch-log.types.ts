import type { ActivitySubject } from "../../social/services/activity-recorder.service";
import type { MediaType } from "../constants/media-type.constant";

// A Diary Entry row with its title's id under one name, whichever table it
// lives in. Adapters rename `mediaId` back to movieId / seriesId on the wire.
export type WatchLogRow = {
  id: string;
  userId: string;
  mediaId: number;
  watchedDate: string;
  rating: number | null;
  rewatch: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type WatchLogInsert = Pick<
  WatchLogRow,
  "userId" | "mediaId" | "watchedDate" | "rating" | "rewatch"
>;

export type WatchLogPatch = Partial<Pick<WatchLogRow, "watchedDate" | "rating" | "rewatch">>;

export type LatestRatedLog = { id: string; rating: number };

export type AttachedReview = { id: string; content: string; containsSpoilers: boolean };

export type WatchLogAdminRow = {
  id: string;
  userId: string;
  authorUsername: string;
  watchedDate: string;
  rating: number | null;
  rewatch: boolean;
  mediaId: number;
  mediaTitle: string;
  createdAt: Date;
};

// Table access for one media type's Diary Entries. Passing no userId to
// find/update/remove skips the ownership check (admin moderation only).
export type WatchLogStore = {
  insert: (input: WatchLogInsert) => Promise<WatchLogRow | null>;
  find: (entryId: string, userId?: string) => Promise<(WatchLogRow & { tmdbId: number }) | null>;
  update: (entryId: string, userId: string, patch: WatchLogPatch) => Promise<WatchLogRow | null>;
  remove: (entryId: string, userId?: string) => Promise<WatchLogRow | null>;
  findLatest: (userId: string, mediaId: number) => Promise<WatchLogRow | null>;
  findLatestRated: (userId: string, mediaId: number) => Promise<LatestRatedLog | null>;
  hasLog: (userId: string, mediaId: number, watchedDate?: string) => Promise<boolean>;
  findAttachedReview: (entryId: string) => Promise<AttachedReview | null>;
  listForAdmin: (
    filters: { userId?: string; mediaId?: number },
    limit: number,
    offset: number,
  ) => Promise<WatchLogAdminRow[]>;
};

export type WatchLogTitle = { id: number; tmdbId: number };

// The per-media seam of the Watch Log module: everything a Film log and a
// Series log genuinely do differently. WatchLogService holds the rest.
export type WatchLogAdapter<TTitle extends WatchLogTitle, TEntry, TCreated> = {
  mediaType: MediaType;
  store: WatchLogStore;
  findOrCreateTitle: (tmdbId: number) => Promise<TTitle | null>;
  // Resolves whatever "mark watched" needs before anything is written, so a
  // failure (e.g. TMDB for a Series' seasons) fails the log outright (#69).
  prepareMarkWatched: (title: TTitle) => Promise<(userId: string) => Promise<void>>;
  unwatch: (userId: string, mediaId: number) => Promise<void>;
  activitySubject: (title: TTitle) => ActivitySubject;
  toEntry: (row: WatchLogRow) => TEntry;
  toCreated: (result: { entry: TEntry; title: TTitle; review: AttachedReview | null }) => TCreated;
};

export type WatchLogCreateInput = {
  watchedDate: string;
  rating?: number;
  rewatch?: boolean;
  review?: string;
  containsSpoilers?: boolean;
};

// `review`: text creates or rewrites the attached Review; null or blank
// deletes it; absent leaves it.
export type WatchLogUpdateInput = WatchLogPatch & {
  review?: string | null;
  containsSpoilers?: boolean;
};
