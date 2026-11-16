import type { MediaType } from "../constants/media-type.constant";
import { DiaryTagsRepository, type DiaryTagRow } from "../repositories/diary-tags.repository";

export type DiaryEntryRef = { id: string; mediaType: MediaType };

// Keys a tag row by "movie:<id>" or "tv:<id>": Film and Series entry ids live in separate tables.
const refKey = (mediaType: MediaType, id: string) => `${mediaType}:${id}`;

const groupByEntry = (rows: DiaryTagRow[]): Map<string, string[]> => {
  const byEntry = new Map<string, string[]>();
  for (const row of rows) {
    const key = row.diaryEntryId
      ? refKey("movie", row.diaryEntryId)
      : row.serialDiaryEntryId
        ? refKey("tv", row.serialDiaryEntryId)
        : null;
    if (!key) continue;
    const tags = byEntry.get(key);
    if (tags) tags.push(row.tag);
    else byEntry.set(key, [row.tag]);
  }
  return byEntry;
};

export type DiaryTagLookup = (mediaType: MediaType, entryId: string) => string[];

// Diary Tags: public labels on Film and Series Diary Entries.
export class DiaryTagsService {
  static async replace(userId: string, mediaType: MediaType, entryId: string, tags: string[]) {
    await DiaryTagsRepository.replace(userId, mediaType, entryId, tags);
  }

  static async add(userId: string, mediaType: MediaType, entryId: string, tags: string[]) {
    await DiaryTagsRepository.insert(userId, mediaType, entryId, tags);
  }

  static async forEntry(mediaType: MediaType, entryId: string): Promise<string[]> {
    return DiaryTagsRepository.findForEntry(mediaType, entryId);
  }

  // Batch-loads the tags of a page of entries in one query.
  static async lookupForEntries(entries: DiaryEntryRef[]): Promise<DiaryTagLookup> {
    const filmIds = entries.filter((entry) => entry.mediaType === "movie").map((entry) => entry.id);
    const seriesIds = entries.filter((entry) => entry.mediaType === "tv").map((entry) => entry.id);
    const byEntry = groupByEntry(await DiaryTagsRepository.findForEntries(filmIds, seriesIds));
    return (mediaType, entryId) => byEntry.get(refKey(mediaType, entryId)) ?? [];
  }

  // Every tag of a user's diary in one query (the data export).
  static async lookupForUser(userId: string): Promise<DiaryTagLookup> {
    const byEntry = groupByEntry(await DiaryTagsRepository.findAllByUser(userId));
    return (mediaType, entryId) => byEntry.get(refKey(mediaType, entryId)) ?? [];
  }

  static async topForUser(userId: string, limit: number) {
    return DiaryTagsRepository.topByUser(userId, limit);
  }
}
