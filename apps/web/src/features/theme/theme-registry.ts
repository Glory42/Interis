export type ThemePreview = {
  mode: "light" | "dark";
  swatches: string[];
};

export type ThemeDefinition = {
  id: string;
  label: string;
  description?: string;
  preview?: ThemePreview;
};

const DEFAULT_THEME_ID = "rose-pine";

const SUPPORTED_THEME_IDS = ["rose-pine", "null-log", "nitrate", "marquee"] as const;

const SUPPORTED_THEME_ID_SET = new Set<string>(SUPPORTED_THEME_IDS);

const isSupportedThemeId = (themeId: string): boolean => {
  return SUPPORTED_THEME_ID_SET.has(themeId);
};

// Retired ids that have a direct successor rather than the default.
const RENAMED_THEME_IDS: Record<string, string> = {
  "tokyo-night": "nitrate",
};

const LEGACY_THEME_IDS = new Set([
  "amoled",
  "gruvbox",
  "arkheion",
  "amber-signal",
  "goth",
  "catppuccin-latte",
  "nord-dark",
  "nord-light",
  "sunset",
  "github-dark",
  "github-light",
  "catppuccin-mocha",
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

const normalizeThemeIdInput = (rawThemeId: unknown): string | null => {
  if (typeof rawThemeId !== "string") {
    return null;
  }

  const normalizedThemeId = rawThemeId.trim().toLowerCase();
  if (normalizedThemeId.length === 0) {
    return null;
  }

  return RENAMED_THEME_IDS[normalizedThemeId] ?? normalizedThemeId;
};

const fallbackTheme: ThemeDefinition = {
  id: DEFAULT_THEME_ID,
  label: "Rose Pine",
  description: "The real Rosé Pine palette: iris for actions, rose for films, foam for TV.",
  preview: {
    mode: "dark",
    swatches: ["#191724", "#1f1d2e", "#c4a7e7", "#ebbcba"],
  },
};

const getWindowRegistry = (): Record<string, ThemeDefinition> | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const registry = window.__THIS_IS_CINEMA_THEME_REGISTRY__;
  if (!registry || Object.keys(registry).length === 0) {
    return null;
  }

  return registry;
};

export const getThemeRegistry = (): Record<string, ThemeDefinition> => {
  return getWindowRegistry() ?? { [fallbackTheme.id]: fallbackTheme };
};

export const getDefaultThemeId = (): string => {
  const registry = getThemeRegistry();
  const configuredDefault = normalizeThemeIdInput(
    typeof window !== "undefined"
      ? window.__THIS_IS_CINEMA_DEFAULT_THEME_ID__
      : undefined,
  );

  if (
    configuredDefault &&
    isSupportedThemeId(configuredDefault) &&
    registry[configuredDefault]
  ) {
    return configuredDefault;
  }

  if (registry[DEFAULT_THEME_ID]) {
    return DEFAULT_THEME_ID;
  }

  return Object.keys(registry)[0] ?? fallbackTheme.id;
};

export const listThemes = (): ThemeDefinition[] => {
  const registry = getThemeRegistry();
  const supportedThemes = SUPPORTED_THEME_IDS.map(
    (themeId) => registry[themeId],
  ).filter((theme): theme is ThemeDefinition => Boolean(theme));

  return supportedThemes.length > 0 ? supportedThemes : [fallbackTheme];
};

export const resolveThemeId = (rawThemeId: unknown): string => {
  const registry = getThemeRegistry();
  const normalizedThemeId = normalizeThemeIdInput(rawThemeId);

  if (
    normalizedThemeId &&
    isSupportedThemeId(normalizedThemeId) &&
    registry[normalizedThemeId]
  ) {
    return normalizedThemeId;
  }

  if (normalizedThemeId && LEGACY_THEME_IDS.has(normalizedThemeId)) {
    return registry[DEFAULT_THEME_ID] ? DEFAULT_THEME_ID : getDefaultThemeId();
  }

  if (registry[DEFAULT_THEME_ID]) {
    return DEFAULT_THEME_ID;
  }

  return getDefaultThemeId();
};

export const getThemeById = (rawThemeId: unknown): ThemeDefinition => {
  const resolvedThemeId = resolveThemeId(rawThemeId);
  return getThemeRegistry()[resolvedThemeId] ?? fallbackTheme;
};
