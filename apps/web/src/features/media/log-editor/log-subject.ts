import type { MediaKind } from "@/features/media/media-cache";

// The Film or Series a log is about, as the editor's header shows it.
export type LogMediaTitle = {
  kind: MediaKind;
  tmdbId: number;
  title: string;
  year: number | null;
  posterPath: string | null;
};

// The Review written with a log.
export type AttachedReview = {
  id: string;
  content: string;
  containsSpoilers: boolean;
};

// A new log starts from the viewer's current rating and whether they've logged the title before.
export type NewLogSubject = LogMediaTitle & {
  type: "new";
  rating: number | null;
  rewatch: boolean;
};

export type ExistingLogSubject = LogMediaTitle & {
  type: "existing";
  logId: string;
  watchedDate: string;
  rating: number | null;
  rewatch: boolean;
  review: AttachedReview | null;
};

export type LogSubject = NewLogSubject | ExistingLogSubject;
