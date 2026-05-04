import { createFileRoute } from "@tanstack/react-router";
import { SettingsProfileSection } from "@/features/settings/components/sections/SettingsProfileSection";

export const Route = createFileRoute("/settings/profile")({
  component: SettingsProfilePage,
});

function SettingsProfilePage() {
  return <SettingsProfileSection />;
}
