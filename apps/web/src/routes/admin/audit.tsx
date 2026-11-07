import { createFileRoute } from "@tanstack/react-router";
import { AdminAuditPage } from "@/features/admin/components/AdminAuditPage";

export const Route = createFileRoute("/admin/audit")({
  component: AdminAuditPage,
});
