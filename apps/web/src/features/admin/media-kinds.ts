import type { AdminMediaKind } from "@/features/admin/media-api";

export type AdminMediaKindConfig = {
  noun: string;
  pluralNoun: string;
  panelTitle: string;
  panelDescription: string;
  yearLabel: string;
  creditLabel: string;
  // What a delete takes with it, for the confirm dialog.
  deleteReach: string;
};

export const ADMIN_MEDIA_KINDS: Record<AdminMediaKind, AdminMediaKindConfig> = {
  movie: {
    noun: "movie",
    pluralNoun: "movies",
    panelTitle: "Movies",
    panelDescription: "Manage locally cached movie records.",
    yearLabel: "Year",
    creditLabel: "Director",
    deleteReach: "every diary entry, review, interaction, and list entry",
  },
  serial: {
    noun: "series",
    pluralNoun: "series",
    panelTitle: "Serials",
    panelDescription: "Manage locally cached TV series records.",
    yearLabel: "First air year",
    creditLabel: "Creator",
    deleteReach: "every diary entry, interaction, and list entry",
  },
};
