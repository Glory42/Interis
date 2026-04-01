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

export const MAX_FAVORITE_GENRES = 8;

export const FAVORITE_GENRE_OPTIONS: FavoriteGenre[] = [...favoriteGenreValues];

export const settingsSections: SettingsSectionDefinition[] = [
  {
    id: "profile",
    to: "/settings/profile",
    label: "Profile",
    description: "Username, bio, location, avatar and backdrop uploads.",
  },
  {
    id: "theme",
    to: "/settings/theme",
    label: "Theme",
    description: "Site theme and appearance settings.",
  },
  {
    id: "auth",
    to: "/settings/auth",
    label: "Auth",
    description: "Email and password security settings.",
  },
];
