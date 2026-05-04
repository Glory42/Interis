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
    description: "Profile image, username, bio, and location.",
  },
  {
    id: "theme",
    to: "/settings/theme",
    label: "Theme",
    description: "Appearance theme selection.",
  },
  {
    id: "auth",
    to: "/settings/auth",
    label: "Auth",
    description: "Email and password security settings.",
  },
  {
    id: "genres",
    to: "/settings/genres",
    label: "Genres",
    description: "Favorite genres shown on your profile.",
  },
  {
    id: "favorites",
    to: "/settings/favorites",
    label: "Favorites",
    description: "Top picks showcased on your profile.",
  },
];
