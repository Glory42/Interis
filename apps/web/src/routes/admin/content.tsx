import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { AdminContentPage } from "@/features/admin/components/AdminContentPage";
import { parseContentType, type ContentType } from "@/features/admin/content-types";

type ContentSearch = { type: ContentType };

export const Route = createFileRoute("/admin/content")({
  validateSearch: (search: Partial<ContentSearch> & SearchSchemaInput): ContentSearch => ({ type: parseContentType(search.type) }),
  component: AdminContentRoute,
});

function AdminContentRoute() {
  const { type } = Route.useSearch();
  const navigate = Route.useNavigate();
  return <AdminContentPage type={type} onTypeChange={(next) => void navigate({ search: { type: next } })} />;
}
