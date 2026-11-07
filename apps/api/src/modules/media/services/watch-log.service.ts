import { ActivityRecorder } from "../../social/services/activity-recorder.service";
import { ReviewsService } from "../../reviews/reviews.service";
import { ReviewsRepository } from "../../reviews/repositories/reviews.repository";
import { YourRatingService } from "../../media-interactions/services/your-rating.service";
import type { MediaType } from "../constants/media-type.constant";
import { buildWatchLogActivityMetadata, resolveLogReviewEdit } from "../helpers/watch-log.helper";
import type {
  AttachedReview,
  WatchLogAdapter,
  WatchLogCreateInput,
  WatchLogRow,
  WatchLogStore,
  WatchLogTitle,
  WatchLogUpdateInput,
} from "../types/watch-log.types";

const toAttachedReview = (review: AttachedReview | null): AttachedReview | null =>
  review && { id: review.id, content: review.content, containsSpoilers: review.containsSpoilers };

// The Watch Log module: the whole Diary Entry lifecycle, written once for
// Films and Series. Only what an adapter supplies differs between them.
export class WatchLogService {
  static async create<TTitle extends WatchLogTitle, TEntry, TCreated>(
    adapter: WatchLogAdapter<TTitle, TEntry, TCreated>,
    userId: string,
    tmdbId: number,
    input: WatchLogCreateInput,
  ): Promise<TCreated | null> {
    const title = await adapter.findOrCreateTitle(tmdbId);
    if (!title) return null;
    const markWatched = await adapter.prepareMarkWatched(title);

    const rating = input.rating ?? null;
    const rewatch = input.rewatch ?? false;
    const row = await adapter.store.insert({
      userId,
      mediaId: title.id,
      watchedDate: input.watchedDate,
      rating,
      rewatch,
    });
    if (!row) throw new Error("Failed to create diary entry");

    // Written with the log, so it rides on the log's Activity, not its own.
    const content = input.review?.trim();
    const review = content
      ? await ReviewsRepository.createReview({
          userId,
          mediaType: adapter.mediaType,
          tmdbId: title.tmdbId,
          movieId: adapter.mediaType === "movie" ? title.id : null,
          diaryEntryId: row.id,
          content,
          containsSpoilers: input.containsSpoilers ?? false,
        })
      : null;

    await Promise.all([
      markWatched(userId),
      rating !== null
        ? YourRatingService.followLatestRatedLog(adapter.mediaType, userId, title.id, {
            before: null,
            writtenLogId: row.id,
          })
        : null,
    ]);

    ActivityRecorder.recordMedia({
      userId,
      subject: adapter.activitySubject(title),
      type: "diary_entry",
      entityId: row.id,
      extraMetadata: buildWatchLogActivityMetadata({ rating, rewatch, review }),
    });

    return adapter.toCreated({ entry: adapter.toEntry(row), title, review });
  }

  // Edits the log and, when asked, its attached Review in one call. No
  // transactions on the Neon HTTP driver, so ownership is checked first.
  static async update<TTitle extends WatchLogTitle, TEntry, TCreated>(
    adapter: WatchLogAdapter<TTitle, TEntry, TCreated>,
    entryId: string,
    userId: string,
    input: WatchLogUpdateInput,
  ): Promise<(TEntry & { review: AttachedReview | null }) | null> {
    const existing = await adapter.store.find(entryId, userId);
    if (!existing) return null;

    const { review: reviewText, containsSpoilers, ...fields } = input;
    const patch = Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value !== undefined),
    );
    const movesRating = input.rating !== undefined || input.watchedDate !== undefined;
    const [before, attached] = await Promise.all([
      movesRating ? YourRatingService.latestRatedLog(adapter.mediaType, userId, existing.mediaId) : null,
      adapter.store.findAttachedReview(entryId),
    ]);

    const { tmdbId: _tmdbId, ...unchanged } = existing;
    const row: WatchLogRow | null =
      Object.keys(patch).length > 0 ? await adapter.store.update(entryId, userId, patch) : unchanged;
    if (!row) return null;

    const [review] = await Promise.all([
      WatchLogService.editAttachedReview(adapter, existing, attached, { review: reviewText, containsSpoilers }),
      movesRating
        ? YourRatingService.followLatestRatedLog(adapter.mediaType, userId, row.mediaId, {
            before,
            writtenLogId: row.id,
          })
        : null,
    ]);

    ActivityRecorder.invalidateFeeds(userId);
    return { ...adapter.toEntry(row), review };
  }

  private static async editAttachedReview(
    adapter: { mediaType: MediaType },
    log: WatchLogRow & { tmdbId: number },
    attached: AttachedReview | null,
    input: Pick<WatchLogUpdateInput, "review" | "containsSpoilers">,
  ): Promise<AttachedReview | null> {
    const edit = resolveLogReviewEdit(input, attached);
    switch (edit.kind) {
      case "none":
        return attached;
      case "delete":
        await ReviewsService.remove(edit.reviewId, { by: "author", userId: log.userId });
        return null;
      case "update":
        return toAttachedReview(
          await ReviewsService.update(edit.reviewId, log.userId, {
            content: edit.content,
            containsSpoilers: edit.containsSpoilers,
          }),
        );
      case "create": {
        // The same path as attaching a review to an existing log by hand.
        const created = await ReviewsService.create(log.userId, {
          tmdbId: log.tmdbId,
          mediaType: adapter.mediaType,
          content: edit.content,
          containsSpoilers: edit.containsSpoilers,
          diaryEntryId: log.id,
        });
        return toAttachedReview(created.review);
      }
    }
  }

  // Deleting a log keeps the title watched, as Letterboxd does, unless asked
  // and no other log of it is left (#86, #88). No userId: admin moderation.
  static async remove<TTitle extends WatchLogTitle, TEntry, TCreated>(
    adapter: WatchLogAdapter<TTitle, TEntry, TCreated>,
    entryId: string,
    options: { userId?: string; unwatch?: boolean } = {},
  ): Promise<(TEntry & { unwatched: boolean }) | null> {
    const existing = await adapter.store.find(entryId, options.userId);
    if (!existing) return null;
    const before = await YourRatingService.latestRatedLog(
      adapter.mediaType,
      existing.userId,
      existing.mediaId,
    );

    const deleted = await adapter.store.remove(entryId, options.userId);
    if (!deleted) return null;

    const { userId, mediaId } = deleted;
    const unwatch = options.unwatch === true && !(await adapter.store.hasLog(userId, mediaId));
    await Promise.all([
      ActivityRecorder.retract({ userId, type: "diary_entry", entityId: deleted.id }),
      before?.id === deleted.id
        ? YourRatingService.followLatestRatedLog(adapter.mediaType, userId, mediaId, { before })
        : null,
      unwatch ? adapter.unwatch(userId, mediaId) : null,
    ]);
    return { ...adapter.toEntry(deleted), unwatched: unwatch };
  }

  static async listForAdmin(
    adapter: { mediaType: MediaType; store: WatchLogStore },
    filters: { userId?: string; mediaId?: number },
    limit: number,
    offset: number,
  ) {
    const rows = await adapter.store.listForAdmin(filters, limit, offset);
    return rows.map((row) => ({ ...row, mediaType: adapter.mediaType }));
  }
}
