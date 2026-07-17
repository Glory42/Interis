import { createFileRoute } from "@tanstack/react-router";
import { SettingsBlockedSection } from "@/features/settings/components/sections/SettingsBlockedSection";

export const Route = createFileRoute("/settings/blocked")({
  component: SettingsBlockedPage,
});

function SettingsBlockedPage() {
  return <SettingsBlockedSection />;
}
