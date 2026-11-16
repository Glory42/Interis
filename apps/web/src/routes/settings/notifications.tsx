import { createFileRoute } from "@tanstack/react-router";
import { SettingsNotificationsSection } from "@/features/settings/components/sections/SettingsNotificationsSection";

export const Route = createFileRoute("/settings/notifications")({
  component: SettingsNotificationsPage,
});

function SettingsNotificationsPage() {
  return <SettingsNotificationsSection />;
}
