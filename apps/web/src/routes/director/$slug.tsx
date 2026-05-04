import { createFileRoute, redirect } from "@tanstack/react-router";
import { getPersonDetailBySlug } from "@/features/people/api";
import { PersonDetailPage } from "@/features/people/components/PersonDetailPage";
import { peopleKeys } from "@/features/people/hooks/usePeople";
import { parseSlugParam } from "@/lib/router/params";

export const Route = createFileRoute("/director/$slug")({
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
      queryKey: peopleKeys.detail("director", slug),
      queryFn: ({ signal }) => getPersonDetailBySlug("director", slug, { signal }),
    });

    if (detail.person.slug !== slug) {
      throw redirect({
        to: "/director/$slug",
        params: { slug: detail.person.slug },
      });
    }
  },
  component: DirectorDetailRoute,
});

function DirectorDetailRoute() {
  const { slug: slugParam } = Route.useParams();
  const slug = parseSlugParam(slugParam) ?? "";

  return <PersonDetailPage role="director" slug={slug} />;
}
