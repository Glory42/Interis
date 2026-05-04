import { z } from "zod";

export const SUPPORTED_THEME_IDS = [
  "rose-pine",
  "null-log",
  "gruvbox",
] as const;

export type ThemeId = (typeof SUPPORTED_THEME_IDS)[number];

export const DEFAULT_THEME_ID: ThemeId = "rose-pine";

const MAX_THEME_ID_LENGTH = 64;
const THEME_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const SUPPORTED_THEME_ID_SET = new Set<ThemeId>(SUPPORTED_THEME_IDS);

const LEGACY_THEME_IDS = new Set([
  "arkheion",
  "amber-signal",
  "goth",
  "catppuccin-mocha",
  "catppuccin-latte",
  "nord-dark",
  "nord-light",
  "sunset",
  "github-dark",
  "github-light",
  "starwars",
  "dune",
  "person-of-interest",
  "lotr",
  "graduation",
  "hannibal",
  "spiderman",
  "superman",
  "batman",
  "optimus-prime",
  "doctor-who",
  "got",
]);

export const normalizeThemeId = (rawThemeId: string): ThemeId => {
  const normalizedThemeId = rawThemeId.trim().toLowerCase();

  if (
    normalizedThemeId.length === 0 ||
    normalizedThemeId.length > MAX_THEME_ID_LENGTH ||
    !THEME_ID_PATTERN.test(normalizedThemeId)
  ) {
    return DEFAULT_THEME_ID;
  }

  if (LEGACY_THEME_IDS.has(normalizedThemeId)) {
    return DEFAULT_THEME_ID;
  }

  if (SUPPORTED_THEME_ID_SET.has(normalizedThemeId as ThemeId)) {
    return normalizedThemeId as ThemeId;
  }

  return DEFAULT_THEME_ID;
};

export const ThemeIdInputSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_THEME_ID_LENGTH)
  .transform((themeId): ThemeId => normalizeThemeId(themeId));
