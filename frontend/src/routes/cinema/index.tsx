import { createFileRoute } from "@tanstack/react-router";
import { CinemaArchivePage } from "@/features/films/components/CinemaArchivePage";
import { RouteErrorBoundary } from "@/lib/router/RouteErrorBoundary";

export const Route = createFileRoute("/cinema/")({
  component: CinemaPage,
  errorComponent: (props) => <RouteErrorBoundary {...props} title="Cinema archive unavailable" />,
});

function CinemaPage() {
  return <CinemaArchivePage />;
}
