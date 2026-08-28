export type ArchiveRatingSource = "user" | "tmdb";

export type ArchiveMenuKey = "genre" | "sort" | "language" | "period" | "type";

export type ArchiveCardModuleStyles = {
  accent: string;
  text: string;
  muted: string;
  faint: string;
  border: string;
  borderSoft: string;
  panel: string;
  panelSoft: string;
  panelStrong: string;
  badge: string;
};

export type ReviewCardModuleStyles = ArchiveCardModuleStyles & {
  panelElevated: string;
};
