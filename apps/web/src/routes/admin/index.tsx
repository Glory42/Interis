import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminOverviewPage } from "@/features/admin/components/AdminOverviewPage";
import { parseContentType } from "@/features/admin/content-types";

// Older links used /admin?section=…; send them to the section's own route.
export const Route = createFileRoute("/admin/")({
  beforeLoad: ({ search }) => {
    const section = (search as { section?: unknown }).section;
    if (section === "reports") throw redirect({ to: "/admin/reports" });
    if (section === "users") throw redirect({ to: "/admin/users" });
    if (typeof section === "string") throw redirect({ to: "/admin/content", search: { type: parseContentType(section) } });
  },
  component: AdminOverviewPage,
});
