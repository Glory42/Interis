import { mix, withAlpha } from "@/lib/color";

// Mirrors the four supported themes in apps/web/src/index.css and
// features/theme/theme-registry.ts. Keep ids in sync with the backend's
// themeId whitelist so a theme picked on web shows up here and vice versa.
export const THEME_IDS = ["rose-pine", "null-log", "tokyo-night", "marquee"] as const;
export type ThemeId = (typeof THEME_IDS)[number];
export const DEFAULT_THEME_ID: ThemeId = "rose-pine";

type ThemeBase = {
  id: ThemeId;
  label: string;
  mode: "light" | "dark";
  radius: number;
  displayFont: "grotesk" | "playfair";
  colors: {
    background: string;
    foreground: string;
    card: string;
    secondary: string;
    muted: string;
    mutedForeground: string;
    primary: string;
    primaryForeground: string;
    accent: string;
    border: string;
    input: string;
    destructive: string;
    movie: string;
    serial: string;
    neutral: string;
  };
};

const BASES: Record<ThemeId, ThemeBase> = {
  "rose-pine": {
    id: "rose-pine",
    label: "Rose Pine",
    mode: "dark",
    radius: 12,
    displayFont: "grotesk",
    colors: {
      background: "#171420",
      foreground: "#e8e3f7",
      card: "#1f1b2b",
      secondary: "#26213a",
      muted: "#151220",
      mutedForeground: "#9f98bb",
      primary: "#d4b5ff",
      primaryForeground: "#181422",
      accent: "#f4c2bf",
      border: "#3f3958",
      input: "#26213a",
      destructive: "#f17fa0",
      movie: "#e0a8a3",
      serial: "#9fd4df",
      neutral: "#9c94ad",
    },
  },
  "null-log": {
    id: "null-log",
    label: "Null Log",
    mode: "dark",
    radius: 9,
    displayFont: "grotesk",
    colors: {
      background: "#000000",
      foreground: "#e6e6e6",
      card: "#0d0d0d",
      secondary: "#141414",
      muted: "#0a0a0a",
      mutedForeground: "#8d8d8d",
      primary: "#00ff88",
      primaryForeground: "#020202",
      accent: "#00cfff",
      border: "#232323",
      input: "#141414",
      destructive: "#ff6b85",
      movie: "#00ff88",
      serial: "#00cfff",
      neutral: "#9ca3af",
    },
  },
  "tokyo-night": {
    id: "tokyo-night",
    label: "Tokyo Night",
    mode: "dark",
    radius: 10,
    displayFont: "grotesk",
    colors: {
      background: "#1a1b26",
      foreground: "#c0caf5",
      card: "#1f2335",
      secondary: "#292e42",
      muted: "#1f2335",
      mutedForeground: "#565f89",
      primary: "#7aa2f7",
      primaryForeground: "#16161e",
      accent: "#bb9af7",
      border: "#414868",
      input: "#292e42",
      destructive: "#f7768e",
      movie: "#7aa2f7",
      serial: "#bb9af7",
      neutral: "#565f89",
    },
  },
  marquee: {
    id: "marquee",
    label: "Marquee",
    mode: "light",
    radius: 10,
    displayFont: "playfair",
    colors: {
      background: "#faf6ee",
      foreground: "#2b211a",
      card: "#ffffff",
      secondary: "#f1e4cf",
      muted: "#f3ebde",
      mutedForeground: "#7a6a58",
      primary: "#b8123a",
      primaryForeground: "#fffaf0",
      accent: "#c8892c",
      border: "#e2d5c0",
      input: "#f1e4cf",
      destructive: "#c2410c",
      movie: "#b8123a",
      serial: "#0f766e",
      neutral: "#8a7a68",
    },
  },
};

export const FONTS = {
  body: "Sora_400Regular",
  bodyMedium: "Sora_500Medium",
  bodySemiBold: "Sora_600SemiBold",
  bodyBold: "Sora_700Bold",
  mono: "JetBrainsMono_500Medium",
  monoBold: "JetBrainsMono_700Bold",
} as const;

const DISPLAY_FONTS = {
  grotesk: { regular: "SpaceGrotesk_500Medium", bold: "SpaceGrotesk_700Bold" },
  playfair: { regular: "PlayfairDisplay_500Medium", bold: "PlayfairDisplay_700Bold" },
} as const;

const buildTheme = (base: ThemeBase) => {
  const { colors } = base;
  const shellShade = base.mode === "dark" ? "#000000" : "#ffffff";

  return {
    ...base,
    fonts: {
      ...FONTS,
      display: DISPLAY_FONTS[base.displayFont].regular,
      displayBold: DISPLAY_FONTS[base.displayFont].bold,
    },
    colors: {
      ...colors,
      // Derived tokens matching the web's color-mix() definitions.
      surfaceCard: mix(colors.card, colors.background, 0.55),
      surfaceBorder: withAlpha(colors.foreground, 0.14),
      surfaceBorderStrong: withAlpha(colors.foreground, 0.24),
      shell: mix(colors.background, shellShade, 0.88),
      rowBorder: withAlpha(colors.primary, 0.12),
      pillBg: withAlpha(colors.primary, 0.16),
      pillBorder: withAlpha(colors.primary, 0.34),
      overlay: withAlpha(colors.background, 0.84),
      faint: withAlpha(colors.foreground, 0.36),
      glow: withAlpha(colors.primary, 0.18),
      spoiler: "#f59e0b",
    },
  };
};

export type AppTheme = ReturnType<typeof buildTheme>;

export const THEMES: Record<ThemeId, AppTheme> = {
  "rose-pine": buildTheme(BASES["rose-pine"]),
  "null-log": buildTheme(BASES["null-log"]),
  "tokyo-night": buildTheme(BASES["tokyo-night"]),
  marquee: buildTheme(BASES.marquee),
};

export const isThemeId = (value: unknown): value is ThemeId =>
  typeof value === "string" && (THEME_IDS as readonly string[]).includes(value);
