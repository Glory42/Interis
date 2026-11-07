import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSeriesDetail } from "@/features/tv/api";
import { SeriesDetailPage } from "@/features/tv/components/SeriesDetailPage";
import { seriesKeys } from "@/features/tv/hooks/useTv";
import { parsePositiveIntParam } from "@/lib/router/params";
import { RouteErrorBoundary } from "@/lib/router/RouteErrorBoundary";
import { getPosterUrl } from "@/features/media/tmdb-images";

export const Route = createFileRoute("/serials/$tmdbId")({
  beforeLoad: ({ params }) => {
    if (parsePositiveIntParam(params.tmdbId) !== null) {
      return;
    }

    throw redirect({ to: "/serials" });
  },
  loader: async ({ context, params }) => {
    const tmdbId = parsePositiveIntParam(params.tmdbId);
    if (tmdbId === null) {
      return null;
    }

    return context.queryClient.fetchQuery({
      queryKey: seriesKeys.detailView(tmdbId, "popular"),
      queryFn: ({ signal }) =>
        getSeriesDetail(tmdbId, { reviewsSort: "popular" }, { signal }),
    });
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {};
    }

    const { series } = loaderData;
    const title = series.firstAirYear
      ? `${series.title} (${series.firstAirYear})`
      : series.title;
    const description = series.overview || `${series.title} on Interis.`;

    return {
      meta: [
        { title: `${title} — Interis` },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: getPosterUrl(series.posterPath) },
        { property: "og:type", content: "video.tv_show" },
      ],
    };
  },
  component: TvDetailRoute,
  errorComponent: (props) => <RouteErrorBoundary {...props} title="Serial detail unavailable" />,
});

function TvDetailRoute() {
  const { tmdbId: tmdbIdParam } = Route.useParams();
  const tmdbId = parsePositiveIntParam(tmdbIdParam) ?? 0;

  return <SeriesDetailPage tmdbId={tmdbId} />;
}
