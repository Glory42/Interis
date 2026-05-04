import {
  getThemeById,
  getThemeRegistry,
  resolveThemeId,
} from "@/features/theme/theme-registry";

export const THEME_STORAGE_KEY = "tic-theme-id";

const hasDom = (): boolean =>
  typeof window !== "undefined" && typeof document !== "undefined";

export const readStoredThemeId = (): string | null => {
  if (!hasDom()) {
    return null;
  }

  return window.localStorage.getItem(THEME_STORAGE_KEY);
};

export const writeStoredThemeId = (themeId: string): void => {
  if (!hasDom()) {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, themeId);
};

export const applyThemeToDom = (rawThemeId: unknown): string => {
  const theme = getThemeById(rawThemeId);

  if (!hasDom()) {
    return theme.id;
  }

  const root = document.documentElement;
  for (const [token, value] of Object.entries(theme.tokens)) {
    root.style.setProperty(token, value);
  }
  root.dataset.themeId = theme.id;

  return theme.id;
};

export const applyAndPersistTheme = (rawThemeId: unknown): string => {
  const resolvedThemeId = applyThemeToDom(rawThemeId);
  writeStoredThemeId(resolvedThemeId);
  return resolvedThemeId;
};

export const bootstrapStoredTheme = (): string => {
  const registry = getThemeRegistry();
  const storedThemeId = readStoredThemeId();
  const resolvedThemeId = resolveThemeId(storedThemeId);

  if (!registry[resolvedThemeId]) {
    return applyAndPersistTheme(undefined);
  }

  return applyAndPersistTheme(resolvedThemeId);
};

export const syncThemeFromServer = (rawThemeId: unknown): string => {
  return applyAndPersistTheme(rawThemeId);
};
