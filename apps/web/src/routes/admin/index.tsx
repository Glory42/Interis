import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { AdminDashboardPage } from "@/features/admin/components/AdminDashboardPage";
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
    <PageWrapper title="Admin" subtitle="Moderation, user directory, and content oversight">
      <AdminDashboardPage />
    </PageWrapper>
  );
}
