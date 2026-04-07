import type { PersonRouteRole } from "@/features/people/shared";

export const getPersonModuleStyles = (role: PersonRouteRole) => {
  const accent = role === "director" ? "var(--module-serial)" : "var(--module-cinema)";

  return {
    accent,
    text: "var(--foreground)",
    muted: "color-mix(in srgb, var(--foreground) 68%, transparent)",
    faint: "color-mix(in srgb, var(--foreground) 36%, transparent)",
    border: `color-mix(in srgb, ${accent} 26%, transparent)`,
    borderSoft: `color-mix(in srgb, ${accent} 16%, transparent)`,
    panel: "color-mix(in srgb, var(--card) 92%, var(--background) 8%)",
    panelElevated: "color-mix(in srgb, var(--card) 84%, var(--background) 16%)",
    badge: `color-mix(in srgb, ${accent} 14%, transparent)`,
  } as const;
};
