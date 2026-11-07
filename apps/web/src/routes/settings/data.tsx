import { createFileRoute } from "@tanstack/react-router";
import { DataTransferPage } from "@/features/data-transfer/pages/DataTransferPage";
import { SettingsDangerZone } from "@/features/settings/components/sections/SettingsDangerZone";

export const Route = createFileRoute("/settings/data")({
  component: DataSettingsPage,
});

function DataSettingsPage() {
  return (
    <>
      <DataTransferPage />
      <SettingsDangerZone />
    </>
  );
}
