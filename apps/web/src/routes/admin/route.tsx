import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { requireAdminUser } from "@/lib/router/auth-guards";
import { RouteErrorBoundary } from "@/lib/router/RouteErrorBoundary";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ context, location }) => {
    await requireAdminUser({ queryClient: context.queryClient, redirectPath: location.pathname });
  },
  component: AdminLayout,
  errorComponent: (props) => <RouteErrorBoundary {...props} title="Admin unavailable" />,
});

function AdminLayout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
