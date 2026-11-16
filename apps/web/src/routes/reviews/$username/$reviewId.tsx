import { createFileRoute } from "@tanstack/react-router";
import { getProfileReviewDetail } from "@/features/reviews/api";
import { ProfileReviewDetailPage } from "@/features/reviews/components/ProfileReviewDetailPage";
import { reviewKeys } from "@/features/reviews/hooks/review-keys";
import { reviewShareText, shareCardUrl, shareHeadMeta } from "@/lib/share-meta";

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

    const text = reviewShareText({
      authorName: loaderData.author.displayUsername ?? loaderData.author.username,
      mediaTitle: loaderData.media.title,
      content: loaderData.content,
      containsSpoilers: loaderData.containsSpoilers,
    });

    return {
      meta: shareHeadMeta(text, {
        image: shareCardUrl("review", loaderData.id, loaderData.updatedAt),
        ogType: "article",
      }),
    };
  },
  component: ReviewDetailRoute,
});

function ReviewDetailRoute() {
  const { username, reviewId } = Route.useParams();

  return <ProfileReviewDetailPage username={username} reviewId={reviewId} />;
}
