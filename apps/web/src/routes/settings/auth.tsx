import { createFileRoute } from "@tanstack/react-router";
import { SettingsAuthSection } from "@/features/settings/components/sections/SettingsAuthSection";

export const Route = createFileRoute("/settings/auth")({
  component: SettingsAuthPage,
});

function SettingsAuthPage() {
  return <SettingsAuthSection />;
}
