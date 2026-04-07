import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { getUserProfile } from "@/features/profile/api";
import { ProfileLayout } from "@/features/profile/layout/ProfileLayout";
import { profileKeys } from "@/features/profile/hooks/useProfile";
import { resolveActiveProfileTab } from "@/features/profile/routing/resolveProfileTab";

export const Route = createFileRoute("/profile/$username")({
  loader: async ({ context, params }) => {
    await context.queryClient.prefetchQuery({
      queryKey: profileKeys.detail(params.username),
      queryFn: ({ signal }) => getUserProfile(params.username, { signal }),
    });
  },
  component: ProfileRouteLayout,
});

function ProfileRouteLayout() {
  const { username } = Route.useParams();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const activeTab = resolveActiveProfileTab(pathname, username);

  return (
    <ProfileLayout username={username} activeTab={activeTab}>
      <Outlet />
    </ProfileLayout>
  );
}
