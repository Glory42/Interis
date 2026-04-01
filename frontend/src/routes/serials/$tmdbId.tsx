import { createFileRoute } from "@tanstack/react-router";
import { SerialDetailPage } from "@/features/serials/components/SerialDetailPage";

export const Route = createFileRoute("/serials/$tmdbId")({
  component: SerialsDetailRoute,
});

function SerialsDetailRoute() {
  const { tmdbId: tmdbIdParam } = Route.useParams();
  const tmdbId = Number(tmdbIdParam);

  return <SerialDetailPage tmdbId={tmdbId} />;
}
