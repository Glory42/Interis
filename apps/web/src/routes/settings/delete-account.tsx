import { createFileRoute } from "@tanstack/react-router";
import { SettingsDangerZone } from "@/features/settings/components/sections/SettingsDangerZone";

export const Route = createFileRoute("/settings/delete-account")({
  component: SettingsDangerZone,
});
