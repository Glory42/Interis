import { createFileRoute } from "@tanstack/react-router";
import { getListDetail } from "@/features/lists/api";
import { listKeys } from "@/features/lists/hooks/useLists";
import { ProfileListDetailPage } from "@/features/profile/pages/ProfileListDetailPage";
import { listShareText, shareCardUrl, shareHeadMeta } from "@/lib/share-meta";

export const Route = createFileRoute("/profile/$username/lists/$listId/")({
  // Only feeds head(); a missing or private List is left for the page to report.
  loader: ({ context, params }) =>
    context.queryClient
      .ensureQueryData({
        queryKey: listKeys.detail(params.listId),
        queryFn: ({ signal }) => getListDetail(params.listId, { signal }),
      })
      .catch(() => null),
  head: ({ loaderData, params }) => {
    if (!loaderData) return {};
    const text = listShareText({
      title: loaderData.title,
      ownerName: loaderData.ownerUsername ?? params.username,
      description: loaderData.description,
      entryCount: loaderData.itemCount,
    });
    return { meta: shareHeadMeta(text, { image: shareCardUrl("list", loaderData.id, loaderData.updatedAt), ogType: "website" }) };
  },
  component: ProfileListDetailRoute,
});

function ProfileListDetailRoute() {
  const { username, listId } = Route.useParams();

  return <ProfileListDetailPage username={username} listId={listId} />;
}
