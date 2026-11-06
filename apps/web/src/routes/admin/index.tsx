import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { parseAdminSearch, type AdminSearch } from "@/features/admin/admin-search";
import { AdminDashboardPage } from "@/features/admin/components/AdminDashboardPage";
import { requireAdminUser } from "@/lib/router/auth-guards";

export const Route = createFileRoute("/admin/")({
  // Input is partial so plain links to /admin stay valid; the parsed search is always complete.
  validateSearch: (search: Partial<AdminSearch> & SearchSchemaInput) => parseAdminSearch(search),
  beforeLoad: async ({ context, location }) => {
    await requireAdminUser({
      queryClient: context.queryClient,
      redirectPath: location.pathname,
    });
  },
  component: AdminPage,
});

function AdminPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <PageWrapper title="Admin" subtitle="Moderation, user directory, and content oversight">
      <AdminDashboardPage
        search={search}
        onSearchChange={(next) => void navigate({ search: next })}
      />
    </PageWrapper>
  );
}
