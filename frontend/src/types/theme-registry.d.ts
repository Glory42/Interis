type ThemeRegistryPreview = {
  mode: "light" | "dark";
  swatches: string[];
};

type ThemeRegistryEntry = {
  id: string;
  label: string;
  description?: string;
  preview?: ThemeRegistryPreview;
  tokens: Record<string, string>;
};

declare global {
  interface Window {
    __THIS_IS_CINEMA_THEME_REGISTRY__?: Record<string, ThemeRegistryEntry>;
    __THIS_IS_CINEMA_DEFAULT_THEME_ID__?: string;
  }
}

export {};
