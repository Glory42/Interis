import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { reportStatusSchema, type ReportStatus } from "@/features/admin/api";
import { AdminReportsPanel } from "@/features/admin/components/AdminReportsPanel";

type ReportsSearch = { status: ReportStatus };

export const Route = createFileRoute("/admin/reports")({
  validateSearch: (search: Partial<ReportsSearch> & SearchSchemaInput): ReportsSearch => {
    const status = reportStatusSchema.safeParse(search.status);
    return { status: status.success ? status.data : "pending" };
  },
  component: AdminReportsRoute,
});

function AdminReportsRoute() {
  const { status } = Route.useSearch();
  const navigate = Route.useNavigate();
  return <AdminReportsPanel status={status} onStatusChange={(next) => void navigate({ search: { status: next } })} />;
}
