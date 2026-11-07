import { createFileRoute, redirect } from "@tanstack/react-router";
import { getFilmDetail } from "@/features/films/api";
import { FilmDetailPage } from "@/features/films/components/FilmDetailPage";
import { filmKeys } from "@/features/films/hooks/useFilms";
import { parsePositiveIntParam } from "@/lib/router/params";
import { RouteErrorBoundary } from "@/lib/router/RouteErrorBoundary";
import { getPosterUrl } from "@/features/media/tmdb-images";

export const Route = createFileRoute("/movies/$tmdbId")({
  beforeLoad: ({ params }) => {
    if (parsePositiveIntParam(params.tmdbId) !== null) {
      return;
    }

    throw redirect({ to: "/movies" });
  },
  loader: async ({ context, params }) => {
    const tmdbId = parsePositiveIntParam(params.tmdbId);
    if (tmdbId === null) {
      return null;
    }

    return context.queryClient.fetchQuery({
      queryKey: filmKeys.detailView(tmdbId, "popular"),
      queryFn: ({ signal }) =>
        getFilmDetail(tmdbId, { reviewsSort: "popular" }, { signal }),
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
  component: FilmDetailRoute,
  errorComponent: (props) => <RouteErrorBoundary {...props} title="Movie detail unavailable" />,
});

function FilmDetailRoute() {
  const { tmdbId: tmdbIdParam } = Route.useParams();
  const tmdbId = parsePositiveIntParam(tmdbIdParam) ?? 0;

  return <FilmDetailPage tmdbId={tmdbId} />;
}
