import { SettingsSectionSkeleton } from "@/components/ui/PageSkeletons";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { SettingsLayout } from "@/features/settings/components/SettingsLayout";
import { requireAuthenticatedUser } from "@/lib/router/auth-guards";
import { RouteErrorBoundary } from "@/lib/router/RouteErrorBoundary";

export const Route = createFileRoute("/settings")({
  beforeLoad: async ({ context, location }) => {
    await requireAuthenticatedUser({
      queryClient: context.queryClient,
      redirectPath: location.pathname,
    });
  },
  component: SettingsLayoutRoute,
  errorComponent: (props) => <RouteErrorBoundary {...props} title="Settings unavailable" />,
});

function SettingsLayoutRoute() {
  const { user, isUserLoading } = useAuth();

  return (
    <SettingsLayout>
      {isUserLoading || !user ? (
        <SettingsSectionSkeleton />
      ) : (
        <Outlet />
      )}
    </SettingsLayout>
  );
}
