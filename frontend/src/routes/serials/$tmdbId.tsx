import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSeriesDetail } from "@/features/serials/api";
import { SerialDetailPage } from "@/features/serials/components/SerialDetailPage";
import { serialKeys } from "@/features/serials/hooks/useSerials";
import { parsePositiveIntParam } from "@/lib/router/params";

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
      return;
    }

    await context.queryClient.prefetchQuery({
      queryKey: serialKeys.detailView(tmdbId, "popular"),
      queryFn: ({ signal }) =>
        getSeriesDetail(tmdbId, { reviewsSort: "popular" }, { signal }),
    });
  },
  component: SerialsDetailRoute,
});

function SerialsDetailRoute() {
  const { tmdbId: tmdbIdParam } = Route.useParams();
  const tmdbId = parsePositiveIntParam(tmdbIdParam) ?? 0;

  return <SerialDetailPage tmdbId={tmdbId} />;
}
