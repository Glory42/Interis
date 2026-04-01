import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { Spinner } from "@/components/ui/spinner";
import { authQueryOptions, useAuth } from "@/features/auth/hooks/useAuth";
import { SettingsLayout } from "@/features/settings/components/SettingsLayout";

export const Route = createFileRoute("/settings")({
  beforeLoad: async ({ context, location }) => {
    const user = await context.queryClient.ensureQueryData(authQueryOptions);
    if (!user) {
      throw redirect({
        to: "/login",
        search: { redirect: location.pathname },
      });
    }
  },
  component: SettingsLayoutRoute,
});

function SettingsLayoutRoute() {
  const { user, isUserLoading } = useAuth();

  return (
    <SettingsLayout>
      {isUserLoading || !user ? (
        <div className="rounded-xl border border-border/70 bg-card/60 p-4 text-sm text-muted-foreground">
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
