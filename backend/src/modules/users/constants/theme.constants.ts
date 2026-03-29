import { z } from "zod";

export const DEFAULT_THEME_ID = "arkheion";

export const THEME_IDS = [
  DEFAULT_THEME_ID,
  "amber-signal",
  "goth",
  "catppuccin-mocha",
  "catppuccin-latte",
  "nord-dark",
  "nord-light",
  "sunset",
] as const;

export const LEGACY_THEME_IDS = ["github-dark", "github-light"] as const;

export type ThemeId = (typeof THEME_IDS)[number];
export type LegacyThemeId = (typeof LEGACY_THEME_IDS)[number];

export const ThemeIdSchema = z.enum(THEME_IDS);
export const LegacyThemeIdSchema = z.enum(LEGACY_THEME_IDS);

const LEGACY_THEME_ID_MAP: Record<LegacyThemeId, ThemeId> = {
  "github-dark": DEFAULT_THEME_ID,
  "github-light": DEFAULT_THEME_ID,
};

const THEME_ID_SET = new Set<string>(THEME_IDS);

export const normalizeThemeId = (rawThemeId: string): ThemeId => {
  if (Object.prototype.hasOwnProperty.call(LEGACY_THEME_ID_MAP, rawThemeId)) {
    return LEGACY_THEME_ID_MAP[rawThemeId as LegacyThemeId];
  }

  if (THEME_ID_SET.has(rawThemeId)) {
    return rawThemeId as ThemeId;
  }

  return DEFAULT_THEME_ID;
};

export const ThemeIdInputSchema = z
  .union([ThemeIdSchema, LegacyThemeIdSchema])
  .transform((themeId): ThemeId => normalizeThemeId(themeId));
