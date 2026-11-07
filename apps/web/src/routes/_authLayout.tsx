import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AuthShell } from "@/features/auth/components/AuthShell";

// Pathless layout route (the leading "_" adds no URL segment) shared by
// /login, /register and /forgot-password, so the frame stays mounted between them.
export const Route = createFileRoute("/_authLayout")({
  component: AuthLayoutRoute,
});

function AuthLayoutRoute() {
  return (
    <AuthShell>
      <Outlet />
    </AuthShell>
  );
}
