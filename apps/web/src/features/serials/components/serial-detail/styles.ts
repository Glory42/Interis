export const SERIAL_MODULE_STYLES = {
  accent: "var(--module-serial)",
  text: "var(--foreground)",
  muted: "color-mix(in srgb, var(--foreground) 68%, transparent)",
  faint: "color-mix(in srgb, var(--foreground) 36%, transparent)",
  border: "color-mix(in srgb, var(--module-serial) 26%, transparent)",
  borderSoft: "color-mix(in srgb, var(--module-serial) 16%, transparent)",
  panel: "color-mix(in srgb, var(--card) 92%, var(--background) 8%)",
  panelElevated: "color-mix(in srgb, var(--card) 84%, var(--background) 16%)",
  panelSoft: "color-mix(in srgb, var(--module-serial) 10%, transparent)",
  panelStrong: "color-mix(in srgb, var(--module-serial) 26%, transparent)",
  badge: "color-mix(in srgb, var(--module-serial) 14%, transparent)",
} as const;
