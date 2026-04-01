import { createFileRoute } from "@tanstack/react-router";
import { SerialsArchivePage } from "@/features/serials/components/SerialsArchivePage";

export const Route = createFileRoute("/serials/")({
  component: SerialsPage,
});

function SerialsPage() {
  return <SerialsArchivePage />;
}
