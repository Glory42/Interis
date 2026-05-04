import { createFileRoute } from "@tanstack/react-router";
import { SerialsArchivePage } from "@/features/serials/components/SerialsArchivePage";
import { RouteErrorBoundary } from "@/lib/router/RouteErrorBoundary";

export const Route = createFileRoute("/serials/")({
  component: SerialsPage,
  errorComponent: (props) => <RouteErrorBoundary {...props} title="Serial archive unavailable" />,
});

function SerialsPage() {
  return <SerialsArchivePage />;
}
