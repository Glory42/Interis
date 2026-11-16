import { createFileRoute, redirect } from "@tanstack/react-router";
import { getPersonDetailBySlug } from "@/features/people/api";
import { PersonDetailPage } from "@/features/people/components/PersonDetailPage";
import { peopleKeys } from "@/features/people/hooks/usePeople";
import { getPersonShareImageUrl } from "@/features/media/tmdb-images";
import { parseSlugParam } from "@/lib/router/params";
import { personShareText, shareHeadMeta } from "@/lib/share-meta";

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

    return detail;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { person } = loaderData;
    return {
      meta: shareHeadMeta(personShareText({ name: person.name, role: "director" }), {
        image: getPersonShareImageUrl(person.profilePath),
        ogType: "profile",
      }),
    };
  },
  component: DirectorDetailRoute,
});

function DirectorDetailRoute() {
  const { slug: slugParam } = Route.useParams();
  const slug = parseSlugParam(slugParam) ?? "";

  return <PersonDetailPage role="director" slug={slug} />;
}
