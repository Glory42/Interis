import { createFileRoute } from "@tanstack/react-router";
import { AdminCachePage } from "@/features/admin/components/AdminCachePage";

export const Route = createFileRoute("/admin/cache")({
  component: AdminCachePage,
});
