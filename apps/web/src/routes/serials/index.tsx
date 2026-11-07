import { createFileRoute } from "@tanstack/react-router";
import { TvArchivePage } from "@/features/tv/components/TvArchivePage";
import { RouteErrorBoundary } from "@/lib/router/RouteErrorBoundary";

export const Route = createFileRoute("/serials/")({
  component: TvPage,
  errorComponent: (props) => <RouteErrorBoundary {...props} title="Serial archive unavailable" />,
});

function TvPage() {
  return <TvArchivePage />;
}
