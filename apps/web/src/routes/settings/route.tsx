import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { SettingsLayout } from "@/features/settings/components/SettingsLayout";
import { requireAuthenticatedUser } from "@/lib/router/auth-guards";
import { RouteErrorBoundary } from "@/lib/router/RouteErrorBoundary";
import { TickLoader } from "@/components/ui/tick-loader";

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
        <div className="border px-4 py-3 text-sm shell-border shell-muted surface">
          <p className="flex items-center gap-2">
            <TickLoader /> Loading settings...
          </p>
        </div>
      ) : (
        <Outlet />
      )}
    </SettingsLayout>
  );
}
