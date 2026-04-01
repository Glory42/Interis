import { createFileRoute } from "@tanstack/react-router";
import { CinemaDetailPage } from "@/features/films/components/CinemaDetailPage";

export const Route = createFileRoute("/cinema/$tmdbId")({
  component: CinemaDetailRoute,
});

function CinemaDetailRoute() {
  const { tmdbId: tmdbIdParam } = Route.useParams();
  const tmdbId = Number(tmdbIdParam);

  return <CinemaDetailPage tmdbId={tmdbId} />;
}
