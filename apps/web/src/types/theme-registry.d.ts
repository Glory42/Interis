type ThemeRegistryId = "rose-pine" | "null-log" | "nitrate" | "marquee";

type ThemeRegistryPreview = {
  mode: "light" | "dark";
  swatches: string[];
};

type ThemeRegistryEntry = {
  id: ThemeRegistryId;
  label: string;
  description?: string;
  preview?: ThemeRegistryPreview;
};

declare global {
  interface Window {
    __THIS_IS_CINEMA_THEME_REGISTRY__?: Record<string, ThemeRegistryEntry>;
    __THIS_IS_CINEMA_DEFAULT_THEME_ID__?: ThemeRegistryId;
  }
}

export {};
