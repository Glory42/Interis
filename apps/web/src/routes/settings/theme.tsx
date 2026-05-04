import { createFileRoute } from "@tanstack/react-router";
import { SettingsThemeSection } from "@/features/settings/components/sections/SettingsThemeSection";

export const Route = createFileRoute("/settings/theme")({
  component: SettingsThemePage,
});

function SettingsThemePage() {
  return <SettingsThemeSection />;
}
