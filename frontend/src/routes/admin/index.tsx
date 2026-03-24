import { Navigate, createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent } from "@/components/ui/card";
import { AdminPlaceholder } from "@/features/admin/components/AdminPlaceholder";
import { useAuth } from "@/features/auth/hooks/useAuth";

export const Route = createFileRoute("/admin/")({
  component: AdminPage,
});

function AdminPage() {
  const { user, isUserLoading } = useAuth();

  if (!isUserLoading && !user) {
    return <Navigate to="/login" search={{ redirect: "/admin" }} />;
  }

  if (!isUserLoading && user && !user.isAdmin) {
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
