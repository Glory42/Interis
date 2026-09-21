import { createFileRoute } from "@tanstack/react-router";
import { MovieArchivePage } from "@/features/movies/components/MovieArchivePage";
import { RouteErrorBoundary } from "@/lib/router/RouteErrorBoundary";

export const Route = createFileRoute("/movies/")({
  component: MoviesPage,
  errorComponent: (props) => <RouteErrorBoundary {...props} title="Movie archive unavailable" />,
});

function MoviesPage() {
  return <MovieArchivePage />;
}
