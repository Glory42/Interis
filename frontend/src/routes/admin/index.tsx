import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent } from "@/components/ui/card";
import { AdminPlaceholder } from "@/features/admin/components/AdminPlaceholder";
import { authQueryOptions, useAuth } from "@/features/auth/hooks/useAuth";

export const Route = createFileRoute("/admin/")({
  beforeLoad: async ({ context, location }) => {
    const user = await context.queryClient.ensureQueryData(authQueryOptions);
    if (!user) {
      throw redirect({
        to: "/login",
        search: { redirect: location.pathname },
      });
    }
  },
  component: AdminPage,
});

function AdminPage() {
  const { user, isUserLoading } = useAuth();

  if (isUserLoading || !user) {
    return (
      <PageWrapper>
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Loading admin access...
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  if (!user.isAdmin) {
    return (
      <PageWrapper title="Forbidden">
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            This route is reserved for admins.
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Admin" subtitle="Phase 4 management tools">
      <AdminPlaceholder />
    </PageWrapper>
  );
}
