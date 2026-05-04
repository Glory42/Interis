type ThemeRegistryId = "rose-pine" | "null-log" | "gruvbox";

type ThemeRegistryPreview = {
  mode: "light" | "dark";
  swatches: string[];
};

type ThemeRegistryEntry = {
  id: ThemeRegistryId;
  label: string;
  description?: string;
  preview?: ThemeRegistryPreview;
  tokens: Record<string, string>;
};

declare global {
  interface Window {
    __THIS_IS_CINEMA_THEME_REGISTRY__?: Record<string, ThemeRegistryEntry>;
    __THIS_IS_CINEMA_DEFAULT_THEME_ID__?: ThemeRegistryId;
  }
}

export {};
