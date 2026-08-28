import { createFileRoute } from "@tanstack/react-router";
import { BooksArchivePage } from "@/features/books/components/BooksArchivePage";
import { RouteErrorBoundary } from "@/lib/router/RouteErrorBoundary";

export const Route = createFileRoute("/books/")({
  component: BooksPage,
  errorComponent: (props) => <RouteErrorBoundary {...props} title="Book archive unavailable" />,
});

function BooksPage() {
  return <BooksArchivePage />;
}
