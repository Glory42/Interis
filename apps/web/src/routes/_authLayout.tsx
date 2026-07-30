import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AuthTrendingCarousel } from "@/features/auth/components/AuthTrendingCarousel";

// Pathless layout route (the leading "_" contributes no URL segment) shared
// by /login, /register, and /forgot-password — see routes/_authLayout/*.
// Keeping the carousel mounted here (instead of inside each page) means it
// survives navigation between those three routes instead of remounting and
// resetting its rotation every time.
export const Route = createFileRoute("/_authLayout")({
  component: AuthLayoutRoute,
});

function AuthLayoutRoute() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-6xl flex-col justify-center px-4 py-8">
      <div className="grid gap-10 lg:grid-cols-[28rem_32rem] lg:items-center lg:justify-start">
        <div className="w-full max-w-md">
          <Outlet />
        </div>

        <div className="hidden lg:block">
          <AuthTrendingCarousel />
        </div>
      </div>
    </section>
  );
}
