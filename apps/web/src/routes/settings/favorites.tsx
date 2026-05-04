import { createFileRoute } from "@tanstack/react-router";
import { SettingsFavoritesSection } from "@/features/settings/components/sections/SettingsFavoritesSection";

export const Route = createFileRoute("/settings/favorites")({
  component: SettingsFavoritesPage,
});

function SettingsFavoritesPage() {
  return <SettingsFavoritesSection />;
}
