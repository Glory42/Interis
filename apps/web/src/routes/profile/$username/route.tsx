import { Outlet, createFileRoute, useMatchRoute } from "@tanstack/react-router";
import { getUserProfile } from "@/features/profile/api";
import type { ProfileTab } from "@/features/profile/components/ProfileTabs";
import { ProfileLayout } from "@/features/profile/layout/ProfileLayout";
import { profileKeys } from "@/features/profile/hooks/useProfile";
import { RouteErrorBoundary } from "@/lib/router/RouteErrorBoundary";

export const Route = createFileRoute("/profile/$username")({
  loader: async ({ context, params }) => {
    return context.queryClient.fetchQuery({
      queryKey: profileKeys.detail(params.username),
      queryFn: ({ signal }) => getUserProfile(params.username, { signal }),
    });
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {};
    }

    const displayName = loaderData.displayUsername ?? loaderData.username;
    const title = `${displayName} (@${loaderData.username})`;
    const description =
      loaderData.bio || `${displayName}'s movie and TV journal on Interis.`;
    const image = loaderData.avatarUrl ?? "/og-image.png";

    return {
      meta: [
        { title: `${title} — Interis` },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: image },
        { property: "og:type", content: "profile" },
      ],
    };
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

    if (matchRoute({ to: "/profile/$username/watching", params: routeParams, fuzzy: true })) {
      return "watching";
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

    if (matchRoute({ to: "/profile/$username/stats", params: routeParams, fuzzy: true })) {
      return "stats";
    }

    return "overview";
  })();

  return (
    <ProfileLayout username={username} activeTab={activeTab}>
      <Outlet />
    </ProfileLayout>
  );
}
