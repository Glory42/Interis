import { Outlet, createFileRoute, useMatchRoute } from "@tanstack/react-router";
import { getUserProfile } from "@/features/profile/api";
import type { ProfileTab } from "@/features/profile/components/ProfileTabs";
import { ProfileLayout } from "@/features/profile/layout/ProfileLayout";
import { profileKeys } from "@/features/profile/hooks/useProfile";
import { RouteErrorBoundary } from "@/lib/router/RouteErrorBoundary";

export const Route = createFileRoute("/profile/$username")({
  loader: async ({ context, params }) => {
    await context.queryClient.prefetchQuery({
      queryKey: profileKeys.detail(params.username),
      queryFn: ({ signal }) => getUserProfile(params.username, { signal }),
    });
  },
  component: ProfileRouteLayout,
  errorComponent: (props) => <RouteErrorBoundary {...props} title="Profile unavailable" />,
});

function ProfileRouteLayout() {
  const { username } = Route.useParams();
  const matchRoute = useMatchRoute();
  const routeParams = { username };

  const activeTab: ProfileTab = (() => {
    if (matchRoute({ to: "/profile/$username/diary", params: routeParams, fuzzy: true })) {
      return "diary";
    }

    if (matchRoute({ to: "/profile/$username/watchlist", params: routeParams, fuzzy: true })) {
      return "watchlist";
    }

    if (matchRoute({ to: "/profile/$username/liked", params: routeParams, fuzzy: true })) {
      return "liked";
    }

    if (matchRoute({ to: "/profile/$username/reviews", params: routeParams, fuzzy: true })) {
      return "reviews";
    }

    if (matchRoute({ to: "/profile/$username/lists", params: routeParams, fuzzy: true })) {
      return "lists";
    }

    if (
      matchRoute({ to: "/profile/$username/cinema", params: routeParams, fuzzy: true }) ||
      matchRoute({ to: "/profile/$username/films", params: routeParams, fuzzy: true })
    ) {
      return "favorites";
    }

    return "overview";
  })();

  return (
    <ProfileLayout username={username} activeTab={activeTab}>
      <Outlet />
    </ProfileLayout>
  );
}
