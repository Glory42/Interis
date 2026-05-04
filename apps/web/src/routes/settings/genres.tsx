import { createFileRoute } from "@tanstack/react-router";
import { SettingsGenresSection } from "@/features/settings/components/sections/SettingsGenresSection";

export const Route = createFileRoute("/settings/genres")({
  component: SettingsGenresPage,
});

function SettingsGenresPage() {
  return <SettingsGenresSection />;
}
