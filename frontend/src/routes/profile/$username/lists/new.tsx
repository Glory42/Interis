import { createFileRoute } from "@tanstack/react-router";
import { ListFormPage } from "@/features/lists/pages/ListFormPage";

export const Route = createFileRoute("/profile/$username/lists/new")({
  component: ListNewRoute,
});

function ListNewRoute() {
  const { username } = Route.useParams();

  return <ListFormPage mode="create" username={username} />;
}
