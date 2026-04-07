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
        <div className=" border border-border/70 bg-card/60 p-4 text-sm text-muted-foreground">
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
