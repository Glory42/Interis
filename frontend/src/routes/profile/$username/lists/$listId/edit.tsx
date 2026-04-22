import { createFileRoute } from "@tanstack/react-router";
import { ListFormPage } from "@/features/lists/pages/ListFormPage";

export const Route = createFileRoute("/profile/$username/lists/$listId/edit")({
  component: ListEditRoute,
});

function ListEditRoute() {
  const { username, listId } = Route.useParams();

  return <ListFormPage mode="edit" username={username} listId={listId} />;
}
