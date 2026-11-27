// The default theme (Rose Pine) roles from apps/web/src/index.css; cards always use it.
export const CARD_COLORS = {
  bg: "#191724",
  surface: "#1f1d2e",
  raised: "#26233a",
  fg: "#e0def4",
  muted: "#908caa",
  faint: "#6e6a86",
  line: "rgba(224, 222, 244, 0.12)",
  lineStrong: "rgba(224, 222, 244, 0.24)",
  primary: "#c4a7e7",
  film: "#ebbcba",
  series: "#9ccfd8",
  slate: "#000000",
  slateText: "#8a8a8a",
} as const;

// Each family pairs with an "… Ext" family holding the latin-ext glyphs (see share-card-fonts.ts).
export const CARD_FONTS = {
  display: "Space Grotesk, Space Grotesk Ext",
  body: "Sora, Sora Ext",
  mono: "JetBrains Mono, JetBrains Mono Ext",
} as const;

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

// The story card is a 9:16 share artifact, not a link preview.
export const STORY_CARD_WIDTH = 1080;
export const STORY_CARD_HEIGHT = 1920;
