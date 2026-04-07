import { createFileRoute, redirect } from "@tanstack/react-router";
import { getMovieDetail } from "@/features/films/api";
import { CinemaDetailPage } from "@/features/films/components/CinemaDetailPage";
import { movieKeys } from "@/features/films/hooks/useMovies";
import { parsePositiveIntParam } from "@/lib/router/params";

export const Route = createFileRoute("/cinema/$tmdbId")({
  beforeLoad: ({ params }) => {
    if (parsePositiveIntParam(params.tmdbId) !== null) {
      return;
    }

    throw redirect({ to: "/cinema" });
  },
  loader: async ({ context, params }) => {
    const tmdbId = parsePositiveIntParam(params.tmdbId);
    if (tmdbId === null) {
      return;
    }

    await context.queryClient.prefetchQuery({
      queryKey: movieKeys.detailView(tmdbId, "popular"),
      queryFn: ({ signal }) =>
        getMovieDetail(tmdbId, { reviewsSort: "popular" }, { signal }),
    });
  },
  component: CinemaDetailRoute,
});

function CinemaDetailRoute() {
  const { tmdbId: tmdbIdParam } = Route.useParams();
  const tmdbId = parsePositiveIntParam(tmdbIdParam) ?? 0;

  return <CinemaDetailPage tmdbId={tmdbId} />;
}
