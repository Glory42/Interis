import type { MediaKind } from "@/features/media/media-cache";
import type { MediaFollowingPerson } from "@/features/media/following/api";
import { formatDateOnlyLabel } from "@/lib/time";

const WATCH_STATUS_LABELS = {
  watching: "Watching",
  paused: "Paused",
  dropped: "Dropped",
  completed: "Completed",
} as const;

// "Watched · 3 Mar 2026", "Watching", "Rated"… for one row of the list.
export const toFollowingStatusLabel = (person: MediaFollowingPerson): string => {
  const status = person.watchStatus
    ? WATCH_STATUS_LABELS[person.watchStatus]
    : person.watched
      ? "Watched"
      : person.rating !== null
        ? "Rated"
        : "Reviewed";
  return person.watchedDate ? `${status} · ${formatDateOnlyLabel(person.watchedDate)}` : status;
};

export const toFollowingSummaryLabel = (kind: MediaKind, count: number): string =>
  `${count} ${count === 1 ? "person" : "people"} you follow ${kind === "film" ? "watched" : "watch"} this`;

// One decimal, like every other rocket score on the page.
export const roundAverage = (average: number): number => Math.round(average * 10) / 10;
