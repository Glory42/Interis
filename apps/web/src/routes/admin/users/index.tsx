import { createFileRoute } from "@tanstack/react-router";
import { AdminUsersPanel } from "@/features/admin/components/AdminUsersPanel";

export const Route = createFileRoute("/admin/users/")({
  component: AdminUsersPanel,
});
