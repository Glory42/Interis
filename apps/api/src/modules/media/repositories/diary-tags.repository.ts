import { and, asc, count, desc, eq, inArray, isNotNull, notInArray, or } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { diaryTags } from "../../diary/diary.entity";
import type { MediaType } from "../constants/media-type.constant";

export type DiaryTagRow = { diaryEntryId: string | null; serialDiaryEntryId: string | null; tag: string };

const entryColumn = (mediaType: MediaType) =>
  mediaType === "movie" ? diaryTags.diaryEntryId : diaryTags.serialDiaryEntryId;
const entryKey = (mediaType: MediaType) => (mediaType === "movie" ? "diaryEntryId" : "serialDiaryEntryId");

const tagRowColumns = {
  diaryEntryId: diaryTags.diaryEntryId,
  serialDiaryEntryId: diaryTags.serialDiaryEntryId,
  tag: diaryTags.tag,
};

// The Diary Tags of Film and Series Diary Entries, one row per entry and tag.
export class DiaryTagsRepository {
  static async insert(userId: string, mediaType: MediaType, entryId: string, tags: string[]) {
    if (tags.length === 0) return;
    await db
      .insert(diaryTags)
      .values(tags.map((tag) => ({ userId, tag, [entryKey(mediaType)]: entryId })))
      .onConflictDoNothing();
  }

  // The delete only touches tags outside the new set and the insert skips existing ones, so both run at once.
  static async replace(userId: string, mediaType: MediaType, entryId: string, tags: string[]) {
    const column = entryColumn(mediaType);
    await Promise.all([
      db
        .delete(diaryTags)
        .where(and(eq(column, entryId), tags.length > 0 ? notInArray(diaryTags.tag, tags) : undefined)),
      DiaryTagsRepository.insert(userId, mediaType, entryId, tags),
    ]);
  }

  static async findForEntry(mediaType: MediaType, entryId: string): Promise<string[]> {
    const rows = await db
      .select({ tag: diaryTags.tag })
      .from(diaryTags)
      .where(eq(entryColumn(mediaType), entryId))
      .orderBy(asc(diaryTags.tag));
    return rows.map((row) => row.tag);
  }

  // One query for a whole page of entries, whichever media types it mixes.
  static async findForEntries(filmEntryIds: string[], seriesEntryIds: string[]): Promise<DiaryTagRow[]> {
    const conditions = [
      filmEntryIds.length > 0 ? inArray(diaryTags.diaryEntryId, filmEntryIds) : undefined,
      seriesEntryIds.length > 0 ? inArray(diaryTags.serialDiaryEntryId, seriesEntryIds) : undefined,
    ].filter((condition) => condition !== undefined);
    if (conditions.length === 0) return [];
    return db
      .select(tagRowColumns)
      .from(diaryTags)
      .where(or(...conditions))
      .orderBy(asc(diaryTags.tag));
  }

  static async findAllByUser(userId: string): Promise<DiaryTagRow[]> {
    return db.select(tagRowColumns).from(diaryTags).where(eq(diaryTags.userId, userId)).orderBy(asc(diaryTags.tag));
  }

  // The user's most used tags, most entries first.
  static async topByUser(userId: string, limit: number): Promise<{ tag: string; count: number }[]> {
    const entries = count();
    return db
      .select({ tag: diaryTags.tag, count: entries })
      .from(diaryTags)
      .where(eq(diaryTags.userId, userId))
      .groupBy(diaryTags.tag)
      .orderBy(desc(entries), asc(diaryTags.tag))
      .limit(limit);
  }

  // The ids of one user's entries of a media type carrying a tag, for a diary query's WHERE.
  static taggedEntryIds(userId: string, mediaType: MediaType, tag: string) {
    const column = entryColumn(mediaType);
    return db
      .select({ id: column })
      .from(diaryTags)
      .where(and(eq(diaryTags.userId, userId), eq(diaryTags.tag, tag), isNotNull(column)));
  }
}
