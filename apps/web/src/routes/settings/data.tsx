import { createFileRoute } from "@tanstack/react-router";
import { DataTransferPage } from "@/features/data-transfer/pages/DataTransferPage";

export const Route = createFileRoute("/settings/data")({
  component: DataSettingsPage,
});

function DataSettingsPage() {
  return <DataTransferPage />;
}
