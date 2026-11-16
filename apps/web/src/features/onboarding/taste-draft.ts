import type { OnboardingTitle, TasteItem } from "@/features/onboarding/api";
import type { ViewerStatus } from "@/features/viewer-status/api";

export type TasteMark = { watched: boolean; rating: number | null };
// Unsaved marks by "mediaType:tmdbId"; the server's state fills in the rest.
export type TasteDraft = Record<string, TasteMark>;

const storageKey = (userId: string) => `interis:onboarding-taste:${userId}`;

// Session storage only keeps picks across a refresh; it may be unavailable.
export const readTasteDraft = (userId: string): TasteDraft => {
  try {
    const raw = window.sessionStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as TasteDraft) : {};
  } catch {
    return {};
  }
};

export const writeTasteDraft = (userId: string, draft: TasteDraft): void => {
  try {
    if (Object.keys(draft).length === 0) window.sessionStorage.removeItem(storageKey(userId));
    else window.sessionStorage.setItem(storageKey(userId), JSON.stringify(draft));
  } catch {
    // Picks still work for this visit.
  }
};

export const serverMark = (status: ViewerStatus | undefined): TasteMark => ({
  watched: status?.watched ?? false,
  rating: status?.rating ?? null,
});

// The batch to send: only titles whose draft differs from what's saved.
export const toTasteChanges = (
  titles: OnboardingTitle[],
  draft: TasteDraft,
  statuses: Map<string, ViewerStatus>,
): TasteItem[] =>
  titles.flatMap((title) => {
    const key = `${title.mediaType}:${title.tmdbId}`;
    const mark = draft[key];
    if (!mark) return [];
    const saved = serverMark(statuses.get(key));
    if (mark.watched === saved.watched && mark.rating === saved.rating) return [];
    const base = { mediaType: title.mediaType, tmdbId: title.tmdbId };
    return [mark.watched ? { ...base, watched: true, rating: mark.rating } : { ...base, watched: false }];
  });
