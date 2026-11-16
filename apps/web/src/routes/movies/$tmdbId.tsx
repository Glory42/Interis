import { createFileRoute, redirect } from "@tanstack/react-router";
import { getFilmDetail } from "@/features/films/api";
import { FilmDetailPage } from "@/features/films/components/FilmDetailPage";
import { filmKeys } from "@/features/films/hooks/useFilms";
import { parsePositiveIntParam } from "@/lib/router/params";
import { RouteErrorBoundary } from "@/lib/router/RouteErrorBoundary";
import { mediaShareText, shareCardUrl, shareHeadMeta } from "@/lib/share-meta";

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
    const text = mediaShareText({ title: movie.title, year: movie.releaseYear, overview: movie.overview });

    return {
      meta: shareHeadMeta(text, { image: shareCardUrl("movie", movie.tmdbId), ogType: "video.movie" }),
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
