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

const fallbackTheme: ThemeDefinition = {
  id: "catppuccin-mocha",
  label: "Catppuccin Mocha",
  description: "Soft dark palette with lavender and blue accents.",
  preview: {
    mode: "dark",
    swatches: ["#1e1e2e", "#181825", "#89b4fa", "#cba6f7"],
  },
  tokens: {
    "--background": "#1e1e2e",
    "--foreground": "#cdd6f4",
    "--card": "#181825",
    "--card-foreground": "#cdd6f4",
    "--popover": "#181825",
    "--popover-foreground": "#cdd6f4",
    "--primary": "#89b4fa",
    "--primary-foreground": "#1e1e2e",
    "--secondary": "#313244",
    "--secondary-foreground": "#cdd6f4",
    "--muted": "#11111b",
    "--muted-foreground": "#a6adc8",
    "--accent": "#cba6f7",
    "--accent-foreground": "#1e1e2e",
    "--border": "#45475a",
    "--input": "#313244",
    "--ring": "#89b4fa",
    "--destructive": "#f38ba8",
    "--aura-primary": "#89b4fa",
    "--aura-secondary": "#cba6f7",
    "--aura-muted": "#6c7086",
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
  const configuredDefault =
    typeof window !== "undefined"
      ? window.__THIS_IS_CINEMA_DEFAULT_THEME_ID__
      : undefined;

  if (configuredDefault && registry[configuredDefault]) {
    return configuredDefault;
  }

  if (registry[fallbackTheme.id]) {
    return fallbackTheme.id;
  }

  return Object.keys(registry)[0] ?? fallbackTheme.id;
};

export const listThemes = (): ThemeDefinition[] => {
  return Object.values(getThemeRegistry());
};

export const resolveThemeId = (rawThemeId: unknown): string => {
  const registry = getThemeRegistry();

  if (typeof rawThemeId === "string" && registry[rawThemeId]) {
    return rawThemeId;
  }

  return getDefaultThemeId();
};

export const getThemeById = (rawThemeId: unknown): ThemeDefinition => {
  const resolvedThemeId = resolveThemeId(rawThemeId);
  return getThemeRegistry()[resolvedThemeId] ?? fallbackTheme;
};
