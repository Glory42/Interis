import { createFileRoute, redirect } from "@tanstack/react-router";
import { getMovieDetail } from "@/features/films/api";
import { getPosterUrl } from "@/features/films/components/utils";
import { CinemaDetailPage } from "@/features/films/components/CinemaDetailPage";
import { movieKeys } from "@/features/films/hooks/useMovies";
import { parsePositiveIntParam } from "@/lib/router/params";
import { RouteErrorBoundary } from "@/lib/router/RouteErrorBoundary";

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
      return null;
    }

    return context.queryClient.fetchQuery({
      queryKey: movieKeys.detailView(tmdbId, "popular"),
      queryFn: ({ signal }) =>
        getMovieDetail(tmdbId, { reviewsSort: "popular" }, { signal }),
    });
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {};
    }

    const { movie } = loaderData;
    const title = movie.releaseYear ? `${movie.title} (${movie.releaseYear})` : movie.title;
    const description = movie.overview || `${movie.title} on Interis.`;

    return {
      meta: [
        { title: `${title} — Interis` },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: getPosterUrl(movie.posterPath) },
        { property: "og:type", content: "video.movie" },
      ],
    };
  },
  component: CinemaDetailRoute,
  errorComponent: (props) => <RouteErrorBoundary {...props} title="Cinema detail unavailable" />,
});

function CinemaDetailRoute() {
  const { tmdbId: tmdbIdParam } = Route.useParams();
  const tmdbId = parsePositiveIntParam(tmdbIdParam) ?? 0;

  return <CinemaDetailPage tmdbId={tmdbId} />;
}
