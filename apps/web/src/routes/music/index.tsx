import { createFileRoute } from "@tanstack/react-router";
import { MusicArchivePage } from "@/features/music/components/MusicArchivePage";
import { RouteErrorBoundary } from "@/lib/router/RouteErrorBoundary";

export const Route = createFileRoute("/music/")({
  component: MusicPage,
  errorComponent: (props) => <RouteErrorBoundary {...props} title="Music archive unavailable" />,
});

function MusicPage() {
  return <MusicArchivePage />;
}
