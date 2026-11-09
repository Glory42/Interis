import { normalizeBoundedLimit } from "../../../commons/helpers/pagination.helper";
import { DEFAULT_FEED_PAGE_SIZE, MAX_FEED_PAGE_SIZE } from "../constants/social-feed.constants";
import { FEED_KINDS } from "../helpers/feed-kinds/feed-kind.registry";
import { toDayKey } from "../helpers/feed-day.helper";
import { groupFeedItems } from "../helpers/social-feed-grouping.helper";
import { foldFeedEntries } from "../helpers/social-feed-folding.helper";
import { decodeFeedCursor, encodeFeedCursor, type FeedCursor } from "../helpers/social-feed-cursor.helper";
import type {
  ActivityRow,
  FeedItem,
  FeedMediaType,
  FeedRow,
  GroupedFeedEntry,
} from "../types/social-feed.types";

// Raw rows a page reads, so a burst of likes (one row each) still leaves room
// for older days on the page.
const GROUPED_FEED_ROW_WINDOW = 100;

// Where a grouped feed's activities come from: the viewer's Follows, or one actor.
export type GroupedFeedSource = {
  // Newest-first activity rows older than `cursor`.
  readRows: (limit: number, cursor: FeedCursor | undefined) => Promise<ActivityRow[]>;
  toItems: (rows: ActivityRow[]) => Promise<FeedItem[]>;
  // A paged source cuts whole days and returns a cursor; an unpaged one is just the newest `limit` rows.
  paged: boolean;
};

export type GroupedFeedPageOptions = {
  limit?: number;
  cursor?: string;
  // A canonical IANA zone (see resolveTimeZone); days are the viewer's local days.
  timeZone: string;
  mediaType?: FeedMediaType;
};

export type GroupedFeedPage = {
  rows: FeedRow[];
  nextCursor: string | null;
};

// Likes of one's own Review, Post or Comment aren't worth a feed row.
const isLikeOfOwnContent = (item: FeedItem): boolean =>
  FEED_KINDS[item.kind].isLike === true && item.metadata.targetUsername === item.actor.username;

// A title group or activity's film/TV kind; null for follows, lists and plain posts.
const entryMediaType = (entry: GroupedFeedEntry): FeedMediaType | null =>
  entry.kind === "title" ? entry.movie.mediaType : (entry.item.movie?.mediaType ?? entry.item.post?.mediaType ?? null);

const toCursor = (row: ActivityRow): string =>
  encodeFeedCursor({ createdAt: row.activity.createdAt, id: row.activity.id });

// Keeps whole days until about `limit` rows show. The peek row's day runs past the
// window, so it waits for the next page unless it's the only day (then it's cut mid-day).
const cutWholeDays = (
  windowRows: ActivityRow[],
  peekRow: ActivityRow | undefined,
  rows: FeedRow[],
  limit: number,
  timeZone: string,
): GroupedFeedPage => {
  const rowDays = windowRows.map((row) => toDayKey(row.activity.createdAt, timeZone));
  const openDay = peekRow ? toDayKey(peekRow.activity.createdAt, timeZone) : null;
  const rowsPerDay = new Map<string, number>();
  for (const row of rows) rowsPerDay.set(row.day, (rowsPerDay.get(row.day) ?? 0) + 1);

  const keptDays = new Set<string>();
  let visibleRows = 0;
  for (const [index, day] of [...new Set(rowDays)].entries()) {
    if (day === openDay && index > 0) break;
    keptDays.add(day);
    visibleRows += rowsPerDay.get(day) ?? 0;
    if (visibleRows >= limit) break;
  }

  const keptRowCount = rowDays.filter((day) => keptDays.has(day)).length;
  const lastKeptRow = windowRows[keptRowCount - 1];
  const hasMore = peekRow !== undefined || keptRowCount < windowRows.length;
  return {
    rows: rows.filter((row) => keptDays.has(row.day)),
    nextCursor: lastKeptRow && hasMore ? toCursor(lastKeptRow) : null,
  };
};

// The Grouped Following Feed and profile overview: activities merged into title
// groups, same-day runs folded into one row, cut into pages of the viewer's days.
export class GroupedFeedService {
  static async readPage(source: GroupedFeedSource, options: GroupedFeedPageOptions): Promise<GroupedFeedPage> {
    const limit = normalizeBoundedLimit(options.limit, { default: DEFAULT_FEED_PAGE_SIZE, max: MAX_FEED_PAGE_SIZE });
    const rowWindow = Math.max(limit * 2, GROUPED_FEED_ROW_WINDOW);
    const cursor = source.paged ? decodeFeedCursor(options.cursor) : undefined;
    const fetched = await source.readRows(source.paged ? rowWindow + 1 : rowWindow, cursor);
    const windowRows = fetched.slice(0, rowWindow);

    const items = (await source.toItems(windowRows)).filter((item) => !isLikeOfOwnContent(item));
    const entries = groupFeedItems(items, options.timeZone);
    // Filtered after grouping, so a filtered page can come back short; the cursor still advances.
    const { mediaType } = options;
    const filtered = mediaType ? entries.filter((entry) => entryMediaType(entry) === mediaType) : entries;
    const rows = foldFeedEntries(filtered, options.timeZone);

    if (!source.paged) return { rows: rows.slice(0, limit), nextCursor: null };
    return cutWholeDays(windowRows, fetched[rowWindow], rows, limit, options.timeZone);
  }
}
