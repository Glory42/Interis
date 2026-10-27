import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_THEME_ID, THEMES, isThemeId, type AppTheme, type ThemeId } from "./themes";

const STORAGE_KEY = "interis.themeId";

type ThemeContextValue = {
  theme: AppTheme;
  themeId: ThemeId;
  setThemeId: (themeId: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const loadStoredThemeId = async (): Promise<ThemeId> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return isThemeId(stored) ? stored : DEFAULT_THEME_ID;
  } catch {
    return DEFAULT_THEME_ID;
  }
};

type ThemeProviderProps = {
  initialThemeId: ThemeId;
  children: ReactNode;
};

export const ThemeProvider = ({ initialThemeId, children }: ThemeProviderProps) => {
  const [themeId, setThemeIdState] = useState<ThemeId>(initialThemeId);

  const setThemeId = useCallback((nextThemeId: ThemeId) => {
    setThemeIdState(nextThemeId);
    AsyncStorage.setItem(STORAGE_KEY, nextThemeId).catch(() => undefined);
  }, []);

  const value = useMemo(
    () => ({ theme: THEMES[themeId], themeId, setThemeId }),
    [themeId, setThemeId],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used inside ThemeProvider");
  }
  return context;
};

export const useTheme = (): AppTheme => useThemeContext().theme;
