import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSeriesDetail } from "@/features/serials/api";
import { SerialSeasonPage } from "@/features/serials/components/SerialSeasonPage";
import { serialKeys } from "@/features/serials/hooks/useSerials";
import { parsePositiveIntParam } from "@/lib/router/params";
import { RouteErrorBoundary } from "@/lib/router/RouteErrorBoundary";

// Season 0 is Specials, so zero is a valid season number.
const parseSeasonNumber = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
};

// D3: on phones each season opens on its own shareable screen.
export const Route = createFileRoute("/serials/$tmdbId_/season/$seasonNumber")({
  beforeLoad: ({ params }) => {
    if (parsePositiveIntParam(params.tmdbId) === null) throw redirect({ to: "/serials" });
    if (parseSeasonNumber(params.seasonNumber) === null) {
      throw redirect({ to: "/serials/$tmdbId", params: { tmdbId: params.tmdbId } });
    }
  },
  loader: ({ context, params }) => {
    const tmdbId = parsePositiveIntParam(params.tmdbId) ?? 0;
    return context.queryClient.ensureQueryData({
      queryKey: serialKeys.detailView(tmdbId, "popular"),
      queryFn: ({ signal }) => getSeriesDetail(tmdbId, { reviewsSort: "popular" }, { signal }),
    });
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return {};
    const season = loaderData.series.seasons.find((entry) => String(entry.seasonNumber) === params.seasonNumber);
    const title = `${loaderData.series.title} · ${season?.name ?? `Season ${params.seasonNumber}`}`;
    return { meta: [{ title: `${title} — Interis` }, { property: "og:title", content: title }] };
  },
  component: SerialSeasonRoute,
  errorComponent: (props) => <RouteErrorBoundary {...props} title="Season unavailable" />,
});

function SerialSeasonRoute() {
  const params = Route.useParams();
  return (
    <SerialSeasonPage
      tmdbId={parsePositiveIntParam(params.tmdbId) ?? 0}
      seasonNumber={parseSeasonNumber(params.seasonNumber) ?? 0}
    />
  );
}
