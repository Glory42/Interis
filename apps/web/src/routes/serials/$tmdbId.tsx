import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSeriesDetail } from "@/features/serials/api";
import { getPosterUrl } from "@/features/serials/components/utils";
import { SerialDetailPage } from "@/features/serials/components/SerialDetailPage";
import { serialKeys } from "@/features/serials/hooks/useSerials";
import { parsePositiveIntParam } from "@/lib/router/params";
import { RouteErrorBoundary } from "@/lib/router/RouteErrorBoundary";

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
      queryKey: serialKeys.detailView(tmdbId, "popular"),
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
  component: SerialsDetailRoute,
  errorComponent: (props) => <RouteErrorBoundary {...props} title="Serial detail unavailable" />,
});

function SerialsDetailRoute() {
  const { tmdbId: tmdbIdParam } = Route.useParams();
  const tmdbId = parsePositiveIntParam(tmdbIdParam) ?? 0;

  return <SerialDetailPage tmdbId={tmdbId} />;
}
