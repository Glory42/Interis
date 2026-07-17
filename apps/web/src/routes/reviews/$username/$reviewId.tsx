import { createFileRoute } from "@tanstack/react-router";
import { getProfileReviewDetail } from "@/features/reviews/api";
import { getPosterUrl } from "@/features/films/components/utils";
import { ProfileReviewDetailPage } from "@/features/reviews/components/ProfileReviewDetailPage";
import { reviewKeys } from "@/features/reviews/hooks/useReviews";

const REVIEW_EXCERPT_MAX_LENGTH = 160;

export const Route = createFileRoute("/reviews/$username/$reviewId")({
  loader: async ({ context, params }) => {
    if (params.username.trim().length === 0 || params.reviewId.trim().length === 0) {
      return null;
    }

    return context.queryClient.fetchQuery({
      queryKey: reviewKeys.detail(params.username, params.reviewId),
      queryFn: ({ signal }) =>
        getProfileReviewDetail(params.username, params.reviewId, { signal }),
    });
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {};
    }

    const authorName = loaderData.author.displayUsername ?? loaderData.author.username;
    const title = `${authorName}'s review of ${loaderData.media.title}`;
    const description = loaderData.containsSpoilers
      ? `Contains spoilers for ${loaderData.media.title}. Read on Interis.`
      : loaderData.content.slice(0, REVIEW_EXCERPT_MAX_LENGTH);

    return {
      meta: [
        { title: `${title} — Interis` },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: getPosterUrl(loaderData.media.posterPath) },
        { property: "og:type", content: "article" },
      ],
    };
  },
  component: ReviewDetailRoute,
});

function ReviewDetailRoute() {
  const { username, reviewId } = Route.useParams();

  return <ProfileReviewDetailPage username={username} reviewId={reviewId} />;
}
