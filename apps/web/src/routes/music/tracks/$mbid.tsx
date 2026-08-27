import { createFileRoute, redirect } from "@tanstack/react-router";
import { getTrackDetail } from "@/features/music/track-api";
import { TrackDetailPage } from "@/features/music/components/TrackDetailPage";
import { trackKeys } from "@/features/music/hooks/useTracks";
import { RouteErrorBoundary } from "@/lib/router/RouteErrorBoundary";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseMbidParam(raw: string): string | null {
  const trimmed = raw.trim();
  return UUID_REGEX.test(trimmed) ? trimmed : null;
}

export const Route = createFileRoute("/music/tracks/$mbid")({
  beforeLoad: ({ params }) => {
    if (parseMbidParam(params.mbid) !== null) return;
    throw redirect({ to: "/music" });
  },
  loader: async ({ context, params }) => {
    const mbid = parseMbidParam(params.mbid);
    if (!mbid) return;

    await context.queryClient.prefetchQuery({
      queryKey: trackKeys.detailView(mbid, "popular"),
      queryFn: ({ signal }) => getTrackDetail(mbid, { reviewsSort: "popular" }, { signal }),
    });
  },
  component: TrackDetailRoute,
  errorComponent: (props) => <RouteErrorBoundary {...props} title="Track detail unavailable" />,
});

function TrackDetailRoute() {
  const { mbid } = Route.useParams();
  return <TrackDetailPage mbid={mbid} />;
}
