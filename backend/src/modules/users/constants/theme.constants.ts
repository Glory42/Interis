import { z } from "zod";

export const DEFAULT_THEME_ID = "catppuccin-mocha";
const MAX_THEME_ID_LENGTH = 64;
const THEME_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REMOVED_THEME_IDS = new Set([
  "arkheion",
  "amber-signal",
  "goth",
  "catppuccin-latte",
  "nord-dark",
  "nord-light",
  "sunset",
  "github-dark",
  "github-light",
]);

export type ThemeId = string;

export const normalizeThemeId = (rawThemeId: string): ThemeId => {
  const normalizedThemeId = rawThemeId.trim().toLowerCase();

  if (
    normalizedThemeId.length === 0 ||
    normalizedThemeId.length > MAX_THEME_ID_LENGTH ||
    !THEME_ID_PATTERN.test(normalizedThemeId)
  ) {
    return DEFAULT_THEME_ID;
  }

  if (REMOVED_THEME_IDS.has(normalizedThemeId)) {
    return DEFAULT_THEME_ID;
  }

  return normalizedThemeId;
};

export const ThemeIdInputSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_THEME_ID_LENGTH)
  .transform((themeId): ThemeId => normalizeThemeId(themeId));
