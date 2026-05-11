import { createFileRoute, redirect } from "@tanstack/react-router";
import { getMusicDetail } from "@/features/music/api";
import { MusicDetailPage } from "@/features/music/components/MusicDetailPage";
import { musicKeys } from "@/features/music/hooks/useMusic";
import { RouteErrorBoundary } from "@/lib/router/RouteErrorBoundary";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseMbidParam(raw: string): string | null {
  const trimmed = raw.trim();
  return UUID_REGEX.test(trimmed) ? trimmed : null;
}

export const Route = createFileRoute("/music/$mbid")({
  beforeLoad: ({ params }) => {
    if (parseMbidParam(params.mbid) !== null) return;
    throw redirect({ to: "/music" });
  },
  loader: async ({ context, params }) => {
    const mbid = parseMbidParam(params.mbid);
    if (!mbid) return;

    await context.queryClient.prefetchQuery({
      queryKey: musicKeys.detailView(mbid, "popular"),
      queryFn: ({ signal }) => getMusicDetail(mbid, { reviewsSort: "popular" }, { signal }),
    });
  },
  component: MusicDetailRoute,
  errorComponent: (props) => <RouteErrorBoundary {...props} title="Album detail unavailable" />,
});

function MusicDetailRoute() {
  const { mbid } = Route.useParams();
  return <MusicDetailPage mbid={mbid} />;
}
