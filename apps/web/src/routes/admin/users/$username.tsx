import { createFileRoute } from "@tanstack/react-router";
import { AdminUserDetailPage } from "@/features/admin/components/AdminUserDetailPage";

export const Route = createFileRoute("/admin/users/$username")({
  component: AdminUserDetailRoute,
});

function AdminUserDetailRoute() {
  const { username } = Route.useParams();
  return <AdminUserDetailPage username={username} />;
}
