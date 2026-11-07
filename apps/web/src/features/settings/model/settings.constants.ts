import type { SettingsSectionDefinition } from "./settings.types";
import { favoriteGenreValues, type FavoriteGenre } from "@/types/api";

export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;

export const IMAGE_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const IMAGE_UPLOAD_MIME_TYPE_SET = new Set<string>(
  IMAGE_UPLOAD_MIME_TYPES,
);

export const MAX_FAVORITE_GENRES = 4;

export const FAVORITE_GENRE_OPTIONS: FavoriteGenre[] = [...favoriteGenreValues];

// Ordered as the side list and the phone index show them.
export const settingsSections: SettingsSectionDefinition[] = [
  { id: "profile", to: "/settings/profile", number: "01", label: "Profile", group: "profile" },
  { id: "favorites", to: "/settings/favorites", number: "02", label: "Top 4", group: "profile" },
  { id: "genres", to: "/settings/genres", number: "03", label: "Genres", group: "profile" },
  { id: "theme", to: "/settings/theme", number: "04", label: "Theme", group: "look" },
  { id: "auth", to: "/settings/auth", number: "05", label: "Account & security", group: "account" },
  { id: "blocked", to: "/settings/blocked", number: "06", label: "Blocked & muted", group: "account" },
  { id: "data", to: "/settings/data", number: "07", label: "Your data", group: "account" },
];

export const SETTINGS_GROUP_LABEL = { profile: "Your profile", look: "Look", account: "Account" } as const;
