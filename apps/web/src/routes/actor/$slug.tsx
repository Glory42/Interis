import { createFileRoute, redirect } from "@tanstack/react-router";
import { getPersonDetailBySlug } from "@/features/people/api";
import { PersonDetailPage } from "@/features/people/components/PersonDetailPage";
import { peopleKeys } from "@/features/people/hooks/usePeople";
import { parseSlugParam } from "@/lib/router/params";

export const Route = createFileRoute("/actor/$slug")({
  beforeLoad: ({ params }) => {
    if (parseSlugParam(params.slug) !== null) {
      return;
    }

    throw redirect({ to: "/" });
  },
  loader: async ({ context, params }) => {
    const slug = parseSlugParam(params.slug);
    if (!slug) {
      return;
    }

    const detail = await context.queryClient.ensureQueryData({
      queryKey: peopleKeys.detail("actor", slug),
      queryFn: ({ signal }) => getPersonDetailBySlug("actor", slug, { signal }),
    });

    if (detail.person.slug !== slug) {
      throw redirect({
        to: "/actor/$slug",
        params: { slug: detail.person.slug },
      });
    }
  },
  component: ActorDetailRoute,
});

function ActorDetailRoute() {
  const { slug: slugParam } = Route.useParams();
  const slug = parseSlugParam(slugParam) ?? "";

  return <PersonDetailPage role="actor" slug={slug} />;
}
