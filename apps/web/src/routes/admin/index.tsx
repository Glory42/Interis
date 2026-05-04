import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { AdminPlaceholder } from "@/features/admin/components/AdminPlaceholder";
import { requireAdminUser } from "@/lib/router/auth-guards";

export const Route = createFileRoute("/admin/")({
  beforeLoad: async ({ context, location }) => {
    await requireAdminUser({
      queryClient: context.queryClient,
      redirectPath: location.pathname,
    });
  },
  component: AdminPage,
});

function AdminPage() {
  return (
    <PageWrapper title="Admin" subtitle="Phase 4 management tools">
      <AdminPlaceholder />
    </PageWrapper>
  );
}
