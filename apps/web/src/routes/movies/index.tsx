import { createFileRoute } from "@tanstack/react-router";
import { FilmArchivePage } from "@/features/films/components/FilmArchivePage";
import { RouteErrorBoundary } from "@/lib/router/RouteErrorBoundary";

export const Route = createFileRoute("/movies/")({
  component: FilmsPage,
  errorComponent: (props) => <RouteErrorBoundary {...props} title="Movie archive unavailable" />,
});

function FilmsPage() {
  return <FilmArchivePage />;
}
