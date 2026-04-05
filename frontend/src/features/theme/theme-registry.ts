export type ThemePreview = {
  mode: "light" | "dark";
  swatches: string[];
};

export type ThemeDefinition = {
  id: string;
  label: string;
  description?: string;
  preview?: ThemePreview;
  tokens: Record<string, string>;
};

const DEFAULT_THEME_ID = "rose-pine";

const SUPPORTED_THEME_IDS = [
  "rose-pine",
  "null-log",
  "gruvbox",
] as const;

const SUPPORTED_THEME_ID_SET = new Set<string>(SUPPORTED_THEME_IDS);

const isSupportedThemeId = (themeId: string): boolean => {
  return SUPPORTED_THEME_ID_SET.has(themeId);
};

const LEGACY_THEME_IDS = new Set([
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
  return normalizedThemeId.length > 0 ? normalizedThemeId : null;
};

const fallbackTheme: ThemeDefinition = {
  id: DEFAULT_THEME_ID,
  label: "Rose Pine",
  description: "Soft dark elegance with mauve, rose, and iris accents.",
  preview: {
    mode: "dark",
    swatches: ["#171420", "#1f1b2b", "#d4b5ff", "#f4c2bf"],
  },
  tokens: {
    "--background": "#171420",
    "--foreground": "#e8e3f7",
    "--card": "#1f1b2b",
    "--card-foreground": "#e8e3f7",
    "--popover": "#1c1927",
    "--popover-foreground": "#e8e3f7",
    "--primary": "#d4b5ff",
    "--primary-foreground": "#181422",
    "--secondary": "#26213a",
    "--secondary-foreground": "#e8e3f7",
    "--muted": "#151220",
    "--muted-foreground": "#9f98bb",
    "--accent": "#f4c2bf",
    "--accent-foreground": "#171420",
    "--border": "#3f3958",
    "--input": "#26213a",
    "--ring": "#9fd4df",
    "--destructive": "#f17fa0",
    "--aura-primary": "#d4b5ff",
    "--aura-secondary": "#9fd4df",
    "--aura-muted": "#6f6789",
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
  const supportedThemes = SUPPORTED_THEME_IDS
    .map((themeId) => registry[themeId])
    .filter((theme): theme is ThemeDefinition => Boolean(theme));

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
