import { createFileRoute, redirect } from "@tanstack/react-router";
import { getBookDetail } from "@/features/books/api";
import { BookDetailPage } from "@/features/books/components/BookDetailPage";
import { bookKeys } from "@/features/books/hooks/useBooks";
import { RouteErrorBoundary } from "@/lib/router/RouteErrorBoundary";

function parseVolumeIdParam(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export const Route = createFileRoute("/books/$volumeId")({
  beforeLoad: ({ params }) => {
    if (parseVolumeIdParam(params.volumeId) !== null) return;
    throw redirect({ to: "/books" });
  },
  loader: async ({ context, params }) => {
    const volumeId = parseVolumeIdParam(params.volumeId);
    if (!volumeId) return;

    await context.queryClient.prefetchQuery({
      queryKey: bookKeys.detailView(volumeId, "popular"),
      queryFn: ({ signal }) => getBookDetail(volumeId, { reviewsSort: "popular" }, { signal }),
    });
  },
  component: BookDetailRoute,
  errorComponent: (props) => <RouteErrorBoundary {...props} title="Book detail unavailable" />,
});

function BookDetailRoute() {
  const { volumeId } = Route.useParams();
  return <BookDetailPage volumeId={volumeId} />;
}
