import { parseIntParam } from "../../../commons/helpers/parse-int-param.helper";

const DEFAULT_PUBLIC_RECENT_LIMIT = 10;
const MAX_PUBLIC_RECENT_LIMIT = 20;
const DEFAULT_PUBLIC_ACTIVITY_LIMIT = 30;
const MAX_PUBLIC_ACTIVITY_LIMIT = 100;
const DEFAULT_PUBLIC_COLLECTION_LIMIT = 50;
const MAX_PUBLIC_COLLECTION_LIMIT = 200;
const DEFAULT_PUBLIC_CURRENTLY_WATCHING_LIMIT = 10;
const MAX_PUBLIC_CURRENTLY_WATCHING_LIMIT = 30;
const MAX_PUBLIC_DIARY_OFFSET = 5_000;

export const normalizePublicRecentLimit = (rawLimit: unknown): number =>
  parseIntParam(rawLimit, DEFAULT_PUBLIC_RECENT_LIMIT, MAX_PUBLIC_RECENT_LIMIT);

export const normalizePublicActivityLimit = (rawLimit: unknown): number =>
  parseIntParam(rawLimit, DEFAULT_PUBLIC_ACTIVITY_LIMIT, MAX_PUBLIC_ACTIVITY_LIMIT);

export const normalizePublicCollectionLimit = (rawLimit: unknown): number =>
  parseIntParam(rawLimit, DEFAULT_PUBLIC_COLLECTION_LIMIT, MAX_PUBLIC_COLLECTION_LIMIT);

export const normalizePublicCurrentlyWatchingLimit = (rawLimit: unknown): number =>
  parseIntParam(rawLimit, DEFAULT_PUBLIC_CURRENTLY_WATCHING_LIMIT, MAX_PUBLIC_CURRENTLY_WATCHING_LIMIT);

export const normalizePublicDiaryOffset = (rawOffset: unknown): number =>
  parseIntParam(rawOffset, 0, MAX_PUBLIC_DIARY_OFFSET);
