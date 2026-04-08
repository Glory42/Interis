import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { SettingsLayout } from "@/features/settings/components/SettingsLayout";
import { requireAuthenticatedUser } from "@/lib/router/auth-guards";

export const Route = createFileRoute("/settings")({
  beforeLoad: async ({ context, location }) => {
    await requireAuthenticatedUser({
      queryClient: context.queryClient,
      redirectPath: location.pathname,
    });
  },
  component: SettingsLayoutRoute,
});

function SettingsLayoutRoute() {
  const { user, isUserLoading } = useAuth();

  return (
    <SettingsLayout>
      {isUserLoading || !user ? (
        <div className="border px-4 py-3 text-sm settings-shell-border settings-shell-muted settings-shell-panel">
          <p className="flex items-center gap-2">
            <Spinner /> Loading settings...
          </p>
        </div>
      ) : (
        <Outlet />
      )}
    </SettingsLayout>
  );
}
