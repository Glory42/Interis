import { createFileRoute } from "@tanstack/react-router";
import { DeveloperPage } from "@/features/developer/pages/DeveloperPage";

export const Route = createFileRoute("/developer")({
  component: DeveloperRoute,
});

function DeveloperRoute() {
  return <DeveloperPage />;
}
