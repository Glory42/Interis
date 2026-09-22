import type { ReviewCardModuleStyles } from "@/features/media/types";

export type MediaModuleStyles = ReviewCardModuleStyles;

export const createMediaModuleStyles = (accentVar: string): MediaModuleStyles => ({
  accent: accentVar,
  text: "var(--foreground)",
  muted: "color-mix(in srgb, var(--foreground) 68%, transparent)",
  faint: "color-mix(in srgb, var(--foreground) 36%, transparent)",
  border: `color-mix(in srgb, ${accentVar} 26%, transparent)`,
  borderSoft: `color-mix(in srgb, ${accentVar} 16%, transparent)`,
  panel: "color-mix(in srgb, var(--card) 92%, var(--background) 8%)",
  panelElevated: "color-mix(in srgb, var(--card) 84%, var(--background) 16%)",
  panelSoft: `color-mix(in srgb, ${accentVar} 10%, transparent)`,
  panelStrong: `color-mix(in srgb, ${accentVar} 26%, transparent)`,
  badge: `color-mix(in srgb, ${accentVar} 14%, transparent)`,
});

export const MOVIE_MODULE_STYLES = createMediaModuleStyles("var(--module-movie)");
export const SERIAL_MODULE_STYLES = createMediaModuleStyles("var(--module-serial)");
